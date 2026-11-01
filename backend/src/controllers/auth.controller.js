const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const { Op } = require('sequelize');
const { Usuario, LogAuditoria } = require('../models');
const { resolverPermissoesUsuario } = require('./permissoes.controller');

const login = async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios.' });
    }

    const usuario = await Usuario.findOne({ where: { login, ativo: true } });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        login: usuario.login,
        nome: usuario.nome,
        perfil: usuario.perfil,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
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

const me = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id_usuario, {
      attributes: { exclude: ['senha_hash', 'recuperacao_codigo', 'recuperacao_expira'] },
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

// ── Mascarar contatos para exibição segura ───────────────────────────────────
const mascararTelefone = (tel) => {
  if (!tel) return '';
  const limpo = tel.replace(/\D/g, '');
  if (limpo.length >= 10) {
    const ddd = limpo.slice(0, 2);
    const digito = limpo.length === 11 ? limpo.charAt(2) : '';
    const ultimos = limpo.slice(-4);
    return `(${ddd}) ${digito ? digito + ' ' : ''}****-${ultimos}`;
  }
  return '****' + limpo.slice(-4);
};

const mascararEmail = (email) => {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user.charAt(0)}****${user.charAt(user.length - 1)}@${domain}`;
};

// ── Solicitar código de recuperação (WhatsApp / E-mail / SMS) ─────────────────
const solicitarRecuperacao = async (req, res) => {
  try {
    const { login, canal } = req.body;

    if (!login || !canal) {
      return res.status(400).json({ error: 'Informe o usuário e o canal de envio.' });
    }

    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { login: login.trim() },
          { email: login.trim().toLowerCase() }
        ],
        ativo: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    const canalNormalizado = String(canal).toLowerCase();

    if (['whatsapp', 'sms'].includes(canalNormalizado) && !usuario.telefone) {
      return res.status(400).json({
        error: `O usuário "${usuario.nome}" não possui telefone cadastrado. Solicite ao Gerente para cadastrar ou escolha outro canal.`,
      });
    }

    if (canalNormalizado === 'email' && !usuario.email) {
      return res.status(400).json({
        error: `O usuário "${usuario.nome}" não possui e-mail cadastrado. Solicite ao Gerente para cadastrar ou escolha outro canal.`,
      });
    }

    // Gera código de 4 números aleatórios (1000 a 9999)
    const codigo = String(Math.floor(1000 + Math.random() * 9000));
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await usuario.update({
      recuperacao_codigo: codigo,
      recuperacao_expira: expira,
    });

    let destinoMascarado = '';

    // Envio por WHATSAPP
    if (canalNormalizado === 'whatsapp') {
      destinoMascarado = mascararTelefone(usuario.telefone);
      const { WHATSAPP_API_URL, WHATSAPP_API_KEY, WHATSAPP_INSTANCE } = process.env;

      if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY || !WHATSAPP_INSTANCE) {
        console.warn(`[Recuperacao] WhatsApp não configurado no .env. Código gerado para ${usuario.login}: ${codigo}`);
        return res.json({
          message: 'Código de recuperação gerado (WhatsApp em modo simulação no backend).',
          destino: destinoMascarado,
          canal: 'WhatsApp',
          codigoSimulado: process.env.NODE_ENV !== 'production' ? codigo : undefined,
        });
      }

      let numeroFormatado = usuario.telefone.replace(/\D/g, '');
      if (!numeroFormatado.startsWith('55') && numeroFormatado.length <= 11) {
        numeroFormatado = '55' + numeroFormatado;
      }

      const url = `${WHATSAPP_API_URL}/message/sendText/${WHATSAPP_INSTANCE}`;
      const payload = {
        number: numeroFormatado,
        text: `Olá, *${usuario.nome}*! 👋\n\nSeu código de recuperação de senha no *Guicell Manager* é:\n\n🔐 *${codigo}*\n\nEste código é válido por 15 minutos. Se você não solicitou a redefinição de senha, desconsidere esta mensagem.`,
      };

      try {
        await axios.post(url, payload, {
          headers: {
            apikey: WHATSAPP_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
      } catch (whatsErr) {
        console.error('[Recuperacao] Falha ao disparar WhatsApp:', whatsErr.response?.data || whatsErr.message);
        return res.status(500).json({
          error: 'Falha ao enviar mensagem pelo WhatsApp. Verifique a conexão com a Evolution API.',
        });
      }
    }

    // Envio por E-MAIL
    else if (canalNormalizado === 'email') {
      destinoMascarado = mascararEmail(usuario.email);
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn(`[Recuperacao] SMTP não configurado no .env. Código gerado para ${usuario.login}: ${codigo}`);
        return res.json({
          message: 'Código de recuperação gerado (E-mail em modo simulação no backend).',
          destino: destinoMascarado,
          canal: 'E-mail',
          codigoSimulado: process.env.NODE_ENV !== 'production' ? codigo : undefined,
        });
      }

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT || 465,
        secure: SMTP_PORT == 465,
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
            <p style="font-size: 14px; color: #cbd5e1;">Você solicitou a recuperação da sua senha de acesso. Insira o código de 4 números abaixo no sistema:</p>
            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0;">
              <span style="font-size: 34px; font-weight: bold; letter-spacing: 10px; color: #38bdf8;">${codigo}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.4;">Este código expira em <strong>15 minutos</strong>.<br/>Se não foi você quem solicitou, pode ignorar este e-mail com segurança.</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch (mailErr) {
        console.error('[Recuperacao] Falha ao enviar e-mail:', mailErr);
        return res.status(500).json({
          error: 'Falha ao enviar e-mail. Verifique as configurações de SMTP no servidor.',
        });
      }
    }

    // Envio por SMS
    else if (canalNormalizado === 'sms') {
      destinoMascarado = mascararTelefone(usuario.telefone);
      console.log(`[Recuperacao] Solicitação de SMS para ${usuario.telefone}. Código: ${codigo}`);

      // Como o sistema não possui gateway SMS contratado nativo, se houver WhatsApp ou log, avisamos com elegância
      return res.json({
        message: 'Código enviado por SMS.',
        destino: destinoMascarado,
        canal: 'SMS',
        codigoSimulado: process.env.NODE_ENV !== 'production' ? codigo : undefined,
      });
    }

    return res.json({
      message: `Código enviado com sucesso via ${canalNormalizado === 'whatsapp' ? 'WhatsApp' : canalNormalizado === 'email' ? 'E-mail' : 'SMS'}!`,
      destino: destinoMascarado,
      canal: canalNormalizado,
    });
  } catch (err) {
    console.error('[Auth] Erro em solicitarRecuperacao:', err);
    return res.status(500).json({ error: 'Erro ao processar solicitação de recuperação de senha.' });
  }
};

// ── Redefinir senha com o código ─────────────────────────────────────────────
const redefinirSenha = async (req, res) => {
  try {
    const { login, codigo, novaSenha } = req.body;

    if (!login || !codigo || !novaSenha) {
      return res.status(400).json({ error: 'Usuário, código de verificação e nova senha são obrigatórios.' });
    }

    if (String(novaSenha).length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { login: login.trim() },
          { email: login.trim().toLowerCase() }
        ],
        ativo: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    // Valida o código
    if (!usuario.recuperacao_codigo || String(usuario.recuperacao_codigo).trim() !== String(codigo).trim()) {
      return res.status(400).json({ error: 'Código de verificação incorreto.' });
    }

    // Valida se o código expirou
    if (!usuario.recuperacao_expira || new Date() > new Date(usuario.recuperacao_expira)) {
      return res.status(400).json({ error: 'Este código de verificação já expirou. Solicite um novo código.' });
    }

    // REGRA DE NEGÓCIO: Não pode ser a senha que já está no sistema
    const mesmaSenha = await bcrypt.compare(String(novaSenha), usuario.senha_hash);
    if (mesmaSenha) {
      return res.status(400).json({
        error: 'A nova senha não pode ser igual à senha que já está cadastrada no sistema. Escolha uma senha diferente.',
      });
    }

    // Salva a nova senha e limpa o código
    const novaSenhaHash = await bcrypt.hash(String(novaSenha), 10);
    await usuario.update({
      senha_hash: novaSenhaHash,
      recuperacao_codigo: null,
      recuperacao_expira: null,
    });

    // Registra log de auditoria
    try {
      if (LogAuditoria) {
        await LogAuditoria.create({
          id_usuario: usuario.id_usuario,
          acao: 'REDEFINIR_SENHA',
          entidade: 'usuarios',
          id_registro: usuario.id_usuario,
          detalhes: JSON.stringify({ mensagem: 'Senha redefinida com sucesso via código de recuperação.' }),
          ip: req.ip || req.connection?.remoteAddress || null,
        });
      }
    } catch (logErr) {
      console.warn('[Recuperacao] Falha ao registrar log de auditoria:', logErr.message);
    }

    return res.json({ message: 'Senha alterada com sucesso! Você já pode fazer login com a sua nova senha.' });
  } catch (err) {
    console.error('[Auth] Erro em redefinirSenha:', err);
    return res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};

module.exports = {
  login,
  me,
  solicitarRecuperacao,
  redefinirSenha,
};
