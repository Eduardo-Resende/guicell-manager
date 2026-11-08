'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { Op } = require('sequelize');
const { Usuario, LogAuditoria, sequelize } = require('../models');
const { resolverPermissoesUsuario } = require('./permissoes.controller');
const { validatePasswordPolicy } = require('../services/passwordPolicy.service');
const {
  generateOtp,
  computeOtpHmac,
  verifyOtpHmac,
  generateResetGrant,
  verifyResetGrant,
  maskPhone,
  maskEmail,
} = require('../services/recovery.service');

// Hash dummy constante pré-computado para mitigação de ataque de temporização (Timing Attack)
// Evita enumeração de usuários quando uma conta não existe no banco.
const DUMMY_TIMING_HASH = bcrypt.hashSync('guicell_constant_timing_mitigation_salt_2026', 10);

/**
 * Autenticação de usuário com mitigação de enumeração, rate limiting
 * e inclusão de versao_sessao no token JWT.
 */
const login = async (req, res) => {
  try {
    const { login: userLogin, senha } = req.body;

    if (!userLogin || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios.' });
    }

    const loginNormalizado = String(userLogin).trim();
    const senhaNormalizada = String(senha).normalize('NFKC');

    // Prevenção contra colisão de truncamento do Bcrypt (limite físico de 72 bytes UTF-8)
    // Se a senha informada excede 72 bytes UTF-8, rejeita de forma imediata com timing constante (AD03)
    if (Buffer.byteLength(senhaNormalizada, 'utf8') > 72) {
      await bcrypt.compare(senhaNormalizada.slice(0, 72), DUMMY_TIMING_HASH);
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Busca usuário ativo no banco
    const usuario = await Usuario.findOne({
      where: {
        login: loginNormalizado,
      },
    });

    // Se o usuário não existir ou estiver desativado, executa bcrypt contra o hash fictício
    // para garantir tempo de resposta equivalente e impedir enumeração de contas por latência.
    if (!usuario || !usuario.ativo) {
      await bcrypt.compare(senhaNormalizada, DUMMY_TIMING_HASH);
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Verifica se a conta está temporariamente bloqueada por excesso de falhas
    if (usuario.login_bloqueado_ate && new Date() < new Date(usuario.login_bloqueado_ate)) {
      const minutosRestantes = Math.ceil((new Date(usuario.login_bloqueado_ate) - new Date()) / 60000);
      return res.status(429).json({
        error: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${minutosRestantes} minuto(s).`,
      });
    }

    // Validação da senha normalizada
    const senhaCorreta = await bcrypt.compare(senhaNormalizada, usuario.senha_hash);
    if (!senhaCorreta) {
      await usuario.increment('login_tentativas', { by: 1 });
      await usuario.reload();

      // Aplica bloqueio temporário após 5 falhas consecutivas
      if (usuario.login_tentativas >= 5) {
        await usuario.update({
          login_bloqueado_ate: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
        });
      }

      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Login com sucesso: reseta contadores de falhas e bloqueios
    if (usuario.login_tentativas > 0 || usuario.login_bloqueado_ate) {
      await usuario.update({
        login_tentativas: 0,
        login_bloqueado_ate: null,
      });
    }

    // Emissão do JWT com versão da sessão
    const versaoSessao = usuario.versao_sessao || 1;
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        login: usuario.login,
        nome: usuario.nome,
        perfil: usuario.perfil,
        versao_sessao: versaoSessao,
      },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      }
    );

    const permissoes = await resolverPermissoesUsuario(usuario);

    return res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        login: usuario.login,
        perfil: usuario.perfil,
        email: usuario.email,
        telefone: usuario.telefone,
        permissoes,
      },
    });
  } catch (err) {
    console.error('[Auth] Erro no login:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

/**
 * Retorna dados do usuário autenticado no token atual.
 */
const me = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      attributes: {
        exclude: [
          'senha_hash',
          'recuperacao_codigo',
          'recuperacao_expira',
          'recuperacao_grant_hash',
          'recuperacao_grant_expira',
        ],
      },
    });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const permissoes = await resolverPermissoesUsuario(usuario);
    const dados = usuario.toJSON();
    dados.permissoes = permissoes;
    return res.json(dados);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

/**
 * Logout seguro: incrementa versao_sessao no banco para revogar o token JWT imediatamente.
 */
const logout = async (req, res) => {
  try {
    if (req.usuario && req.usuario.id_usuario) {
      await Usuario.increment('versao_sessao', {
        by: 1,
        where: { id_usuario: req.usuario.id_usuario },
      });
    }
    return res.json({ message: 'Logout realizado com sucesso. Sessão invalidada.' });
  } catch (err) {
    console.error('[Auth] Erro no logout:', err);
    return res.status(500).json({ error: 'Erro ao processar logout.' });
  }
};

/**
 * Solicitação de recuperação de senha com OTP forte de 8 dígitos.
 * Resposta pública neutra para evitar enumeração de usuários por atacantes.
 */
const solicitarRecuperacao = async (req, res) => {
  try {
    const { login: userLogin, canal } = req.body;

    if (!userLogin || !canal) {
      return res.status(400).json({ error: 'Informe o usuário e o canal de envio.' });
    }

    const canalNormalizado = String(canal).toLowerCase();
    if (!['whatsapp', 'email'].includes(canalNormalizado)) {
      return res.status(400).json({ error: 'Canal de recuperação inválido. Escolha WhatsApp ou E-mail.' });
    }

    const loginTrim = String(userLogin).trim();

    // Resposta padrão idêntica para contas existentes ou não existentes (anti-enumeração)
    const respostaNeutro = {
      message: 'Se houver uma conta ativa vinculada ao identificador informado, o código de recuperação foi enviado.',
      destino: 'contato cadastrado',
      canal: canalNormalizado,
    };

    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { login: loginTrim },
          { email: loginTrim.toLowerCase() },
        ],
        ativo: true,
      },
    });

    if (!usuario) {
      return res.json(respostaNeutro);
    }

    // Se o canal solicitado não estiver disponível para o usuário, retorna resposta neutra sem vazar PII
    if (canalNormalizado === 'whatsapp' && !usuario.telefone) {
      return res.json(respostaNeutro);
    }
    if (canalNormalizado === 'email' && !usuario.email) {
      return res.json(respostaNeutro);
    }

    // Cooldown entre reenvios: para evitar oráculo de enumeração de contas, não retorna HTTP 429
    // por identificador (AD01, AD02). O rate limiting contra flood por IP é tratado pelo middleware.
    // Se estiver em cooldown (< 60s), silenciosamente suprime o disparo de nova mensagem.
    if (usuario.recuperacao_solicitado_em) {
      const segundosPassados = (Date.now() - new Date(usuario.recuperacao_solicitado_em).getTime()) / 1000;
      if (segundosPassados < 60) {
        return res.json(respostaNeutro);
      }
    }

    // Gera OTP forte com 8 dígitos decimais criptograficamente seguros (crypto.randomInt)
    const codigo = generateOtp();
    const hmacCodigo = computeOtpHmac(usuario.id_usuario, codigo);
    const expira = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos de validade estrita

    // Atualiza desafio de forma atômica, resetando contadores e invalidando grant anterior
    await usuario.update({
      recuperacao_codigo: hmacCodigo,
      recuperacao_expira: expira,
      recuperacao_tentativas: 0,
      recuperacao_solicitado_em: new Date(),
      recuperacao_grant_hash: null,
      recuperacao_grant_expira: null,
    });

    // Envio por WHATSAPP (Evolution API)
    if (canalNormalizado === 'whatsapp') {
      const { WHATSAPP_API_URL, WHATSAPP_API_KEY, WHATSAPP_INSTANCE } = process.env;

      if (WHATSAPP_API_URL && WHATSAPP_API_KEY && WHATSAPP_INSTANCE) {
        let numeroFormatado = usuario.telefone.replace(/\D/g, '');
        if (!numeroFormatado.startsWith('55') && numeroFormatado.length <= 11) {
          numeroFormatado = '55' + numeroFormatado;
        }

        const url = `${WHATSAPP_API_URL}/message/sendText/${WHATSAPP_INSTANCE}`;
        const payload = {
          number: numeroFormatado,
          text: `Olá, *${usuario.nome}*! 👋\n\nSeu código de recuperação de senha no *Guicell Manager* é:\n\n🔐 *${codigo}*\n\nEste código possui 8 dígitos e é válido por apenas 5 minutos. Se você não solicitou a redefinição de senha, desconsidere esta mensagem.`,
        };

        try {
          await axios.post(url, payload, {
            headers: {
              apikey: WHATSAPP_API_KEY,
              'Content-Type': 'application/json',
            },
            timeout: 8000,
          });
        } catch (whatsErr) {
          console.error('[Recuperacao] Falha ao disparar WhatsApp:', whatsErr.response?.data || whatsErr.message);
          // Não expõe falha interna ao atacante (AD12)
        }
      } else if (process.env.NODE_ENV !== 'production') {
        console.info(`[Recuperacao] Modo simulação (WhatsApp) para ${usuario.login}: código gerado.`);
      }
    }

    // Envio por E-MAIL (SMTP)
    else if (canalNormalizado === 'email') {
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

      if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: parseInt(SMTP_PORT, 10) || 465,
          secure: parseInt(SMTP_PORT, 10) === 465,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });

        const mailOptions = {
          from: `"Guicell Manager" <${SMTP_USER}>`,
          to: usuario.email,
          subject: `Código de Recuperação: ${codigo} - Guicell Manager`,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 28px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #22c55e; margin-top: 0; font-size: 22px;">Guicell Manager</h2>
              <p style="font-size: 15px;">Olá, <strong>${usuario.nome}</strong>!</p>
              <p style="font-size: 14px; color: #cbd5e1;">Você solicitou a recuperação da sua senha de acesso. Insira o código de 8 dígitos abaixo no sistema:</p>
              <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8;">${codigo}</span>
              </div>
              <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">Este código expira em <strong>5 minutos</strong> e possui limite de 5 tentativas.<br/>Se não foi você quem solicitou, ignore este e-mail.</p>
            </div>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (mailErr) {
          console.error('[Recuperacao] Falha ao enviar e-mail:', mailErr.message);
          // Não expõe falha interna ao atacante (AD12)
        }
      } else if (process.env.NODE_ENV !== 'production') {
        console.info(`[Recuperacao] Modo simulação (E-mail) para ${usuario.login}: código gerado.`);
      }
    }

    // Retorna resposta neutra idêntica em formato, chaves e status para todas as situações
    return res.json(respostaNeutro);
  } catch (err) {
    console.error('[Auth] Erro em solicitarRecuperacao:', err);
    return res.status(500).json({ error: 'Erro ao processar solicitação de recuperação de senha.' });
  }
};

/**
 * Validação do código OTP de 8 dígitos.
 * Em caso de sucesso, consome o OTP e emite um Reset Grant (token de alta entropia de uso único).
 * Protegido por transação atômica e Pessimistic Row Lock para evitar Race Conditions (AD05).
 */
const validarCodigo = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { login: userLogin, codigo } = req.body;

    if (!userLogin || !codigo) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Usuário e código de verificação são obrigatórios.' });
    }

    const codigoLimpo = String(codigo).trim();
    if (!/^\d{8}$/.test(codigoLimpo)) {
      await transaction.rollback();
      return res.status(400).json({ error: 'O código de verificação deve conter exatamente 8 dígitos numéricos.' });
    }

    const loginTrim = String(userLogin).trim();

    // Consulta usuário com Lock exclusivo de linha (pessimistic lock) para serializar requisições simultâneas
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { login: loginTrim },
          { email: loginTrim.toLowerCase() },
        ],
        ativo: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!usuario) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Código de verificação incorreto ou expirado.' });
    }

    // Verifica se há desafio ativo
    if (!usuario.recuperacao_codigo || !usuario.recuperacao_expira) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Nenhum código ativo encontrado. Solicite um novo código.' });
    }

    // Verifica se expirou (5 minutos)
    if (new Date() > new Date(usuario.recuperacao_expira)) {
      await usuario.update({
        recuperacao_codigo: null,
        recuperacao_expira: null,
        recuperacao_tentativas: 0,
      }, { transaction });
      await transaction.commit();
      return res.status(400).json({ error: 'Este código de verificação expirou. Solicite um novo código.' });
    }

    // Verifica se o limite de tentativas foi excedido (máximo 5)
    if (usuario.recuperacao_tentativas >= 5) {
      await usuario.update({
        recuperacao_codigo: null,
        recuperacao_expira: null,
        recuperacao_tentativas: 0,
      }, { transaction });
      await transaction.commit();
      return res.status(400).json({ error: 'Limite de tentativas excedido para este código. Solicite um novo código.' });
    }

    // Validação criptográfica com comparação de tempo constante (HMAC-SHA-256)
    const codigoValido = verifyOtpHmac(usuario.id_usuario, codigoLimpo, usuario.recuperacao_codigo);

    if (!codigoValido) {
      const novasTentativas = (usuario.recuperacao_tentativas || 0) + 1;
      const updateData = { recuperacao_tentativas: novasTentativas };

      if (novasTentativas >= 5) {
        updateData.recuperacao_codigo = null;
        updateData.recuperacao_expira = null;
      }
      await usuario.update(updateData, { transaction });
      await transaction.commit();

      const tentativasRestantes = Math.max(0, 5 - novasTentativas);
      return res.status(400).json({
        error: tentativasRestantes > 0
          ? `Código de verificação incorreto. Você possui mais ${tentativasRestantes} tentativa(s).`
          : 'Código de verificação incorreto. Limite de tentativas excedido. Solicite um novo código.',
      });
    }

    // Sucesso: consome o OTP imediatamente e emite um Reset Grant (256 bits, uso único)
    const { token: resetGrant, hash: grantHash, expira: grantExpira } = generateResetGrant();

    await usuario.update({
      recuperacao_codigo: null,
      recuperacao_expira: null,
      recuperacao_tentativas: 0,
      recuperacao_grant_hash: grantHash,
      recuperacao_grant_expira: grantExpira,
    }, { transaction });

    await transaction.commit();

    return res.json({
      message: 'Código de verificação confirmado com sucesso!',
      resetGrant,
    });
  } catch (err) {
    await transaction.rollback();
    console.error('[Auth] Erro em validarCodigo:', err);
    return res.status(500).json({ error: 'Erro ao validar código de verificação.' });
  }
};

/**
 * Redefinição de senha consumindo o Reset Grant (ou código de 8 dígitos sob concorrência protegida).
 * Aplica política de senhas, atualiza hash, revoga sessões anteriores (versao_sessao)
 * e registra auditoria em transação atômica.
 */
const redefinirSenha = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { login: userLogin, resetGrant, codigo, novaSenha, confirmarNovaSenha } = req.body;

    if (!userLogin || (!resetGrant && !codigo) || !novaSenha) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Usuário, credencial de redefinição e nova senha são obrigatórios.' });
    }

    const senhaNormalizada = String(novaSenha).normalize('NFKC');

    // Se confirmarNovaSenha foi fornecida, verifica igualdade
    if (confirmarNovaSenha !== undefined && senhaNormalizada !== String(confirmarNovaSenha).normalize('NFKC')) {
      await transaction.rollback();
      return res.status(400).json({ error: 'A confirmação de senha não confere com a nova senha digitada.' });
    }

    // Validação estrita da política de senhas (NIST SP 800-63B-4: min 15, max 64, <= 72 bytes UTF-8)
    const policyCheck = validatePasswordPolicy(senhaNormalizada);
    if (!policyCheck.valida) {
      await transaction.rollback();
      return res.status(400).json({ error: policyCheck.mensagem });
    }

    const loginTrim = String(userLogin).trim();

    // Busca usuário com Lock exclusivo de linha para impedir condição de corrida (Race Condition)
    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { login: loginTrim },
          { email: loginTrim.toLowerCase() },
        ],
        ativo: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!usuario) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Credencial de recuperação inválida ou expirada.' });
    }

    let credencialValida = false;

    // Caso 1: Fluxo padrão com Reset Grant de alta entropia
    if (resetGrant) {
      credencialValida = verifyResetGrant(resetGrant, usuario.recuperacao_grant_hash, usuario.recuperacao_grant_expira);
    }
    // Caso 2: Validação direta por OTP (fallback seguro para chamadas diretas)
    else if (codigo) {
      const codigoLimpo = String(codigo).trim();
      const expiraDate = usuario.recuperacao_expira ? new Date(usuario.recuperacao_expira) : null;
      if (expiraDate && new Date() <= expiraDate && (usuario.recuperacao_tentativas || 0) < 5) {
        credencialValida = verifyOtpHmac(usuario.id_usuario, codigoLimpo, usuario.recuperacao_codigo);
      }
    }

    if (!credencialValida) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Credencial de recuperação inválida ou expirada. Inicie uma nova recuperação.' });
    }

    // REGRA DE SEGURANÇA: Não aceita como nova senha a senha já cadastrada
    const mesmaSenha = await bcrypt.compare(senhaNormalizada, usuario.senha_hash);
    if (mesmaSenha) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'A nova senha não pode ser idêntica à senha que já está cadastrada no sistema. Escolha uma senha diferente.',
      });
    }

    // Gera o novo hash Bcrypt (custo 10) com a senha normalizada
    const novaSenhaHash = await bcrypt.hash(senhaNormalizada, 10);

    // Incremento de versao_sessao: revoga imediatamente qualquer JWT antigo emitido anteriormente
    const novaVersaoSessao = (usuario.versao_sessao || 1) + 1;

    // Atualização atômica do usuário na transação
    await usuario.update({
      senha_hash: novaSenhaHash,
      versao_sessao: novaVersaoSessao,
      recuperacao_codigo: null,
      recuperacao_expira: null,
      recuperacao_tentativas: 0,
      recuperacao_grant_hash: null,
      recuperacao_grant_expira: null,
      login_tentativas: 0,
      login_bloqueado_ate: null,
    }, { transaction });

    // Registra log de auditoria
    if (LogAuditoria) {
      await LogAuditoria.create({
        id_usuario: usuario.id_usuario,
        acao: 'REDEFINIR_SENHA',
        entidade: 'usuarios',
        id_registro: usuario.id_usuario,
        dados_posteriores: { mensagem: 'Senha redefinida com sucesso. Sessões anteriores revogadas.' },
        data_hora: new Date(),
        ip_origem: req.ip || req.connection?.remoteAddress || null,
      }, { transaction });
    }

    await transaction.commit();

    // Dispara notificação de segurança pós-commit (sem travar a resposta em caso de falha de envio)
    try {
      const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
      if (usuario.email && SMTP_HOST && SMTP_USER && SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: parseInt(SMTP_PORT, 10) || 465,
          secure: parseInt(SMTP_PORT, 10) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        transporter.sendMail({
          from: `"Guicell Manager" <${SMTP_USER}>`,
          to: usuario.email,
          subject: 'Aviso de Segurança: Senha Redefinida - Guicell Manager',
          text: `Olá ${usuario.nome}, a senha da sua conta no Guicell Manager foi redefinida com sucesso. Se você não reconhece esta alteração, contate o administrador imediatamente.`,
        }).catch((e) => console.warn('[Notificacao] Falha assíncrona ao enviar e-mail de aviso de troca de senha:', e.message));
      }
    } catch (notifErr) {
      // Ignora erro de notificação para não reverter o reset
    }

    return res.json({
      message: 'Senha alterada com sucesso! Você já pode fazer login com a sua nova senha.',
    });
  } catch (err) {
    await transaction.rollback();
    console.error('[Auth] Erro em redefinirSenha:', err);
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};

module.exports = {
  login,
  me,
  logout,
  solicitarRecuperacao,
  validarCodigo,
  redefinirSenha,
};
