const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

const listar = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['senha_hash'] },
      order: [['nome', 'ASC']],
    });
    return res.json(usuarios);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, login, senha, perfil } = req.body;
    if (!nome || !login || !senha || !perfil) {
      return res.status(400).json({ error: 'Nome, login, senha e perfil são obrigatórios.' });
    }
    const senha_hash = await bcrypt.hash(senha, 10);
    const usuario = await Usuario.create({ nome, login, senha_hash, perfil });
    const { senha_hash: _, ...usuarioSemSenha } = usuario.toJSON();
    return res.status(201).json(usuarioSemSenha);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Login já cadastrado.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const atualizar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const campos = { 
      nome: req.body.nome, 
      login: req.body.login, 
      perfil: req.body.perfil, 
      ativo: req.body.ativo 
    };
    if (req.body.senha) {
      campos.senha_hash = await bcrypt.hash(req.body.senha, 10);
    }
    await usuario.update(campos);
    const { senha_hash: _, ...usuarioSemSenha } = usuario.toJSON();
    return res.json(usuarioSemSenha);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Login já cadastrado por outro usuário.' });
    }
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const toggleAtivo = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
    await usuario.update({ ativo: !usuario.ativo });
    return res.json({ message: `Usuário ${usuario.ativo ? 'ativado' : 'desativado'}.`, ativo: usuario.ativo });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

const listarTecnicos = async (req, res) => {
  try {
    const tecnicos = await Usuario.findAll({
      where: { perfil: 'Técnico', ativo: true },
      attributes: ['id_usuario', 'nome'],
      order: [['nome', 'ASC']],
    });
    return res.json(tecnicos);
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno.' });
  }
};

module.exports = { listar, criar, atualizar, toggleAtivo, listarTecnicos };
