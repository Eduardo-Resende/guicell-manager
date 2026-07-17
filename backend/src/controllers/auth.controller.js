const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

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

    return res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        login: usuario.login,
        perfil: usuario.perfil,
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
      attributes: { exclude: ['senha_hash'] },
    });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.json(usuario);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
};

module.exports = { login, me };
