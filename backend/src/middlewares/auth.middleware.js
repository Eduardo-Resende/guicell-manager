const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT.
 * Verifica o token Bearer no header Authorization.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id_usuario, login, perfil }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};

/**
 * Middleware de autorização por perfil.
 * Uso: authorize(['Gerente']) ou authorize(['Gerente', 'Atendente'])
 */
const authorize = (perfisPermitidos) => (req, res, next) => {
  if (!perfisPermitidos.includes(req.usuario.perfil)) {
    return res.status(403).json({
      error: `Acesso negado. Requer perfil: ${perfisPermitidos.join(' ou ')}.`,
    });
  }
  next();
};

module.exports = { authenticate, authorize };
