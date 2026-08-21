import jwt from 'jsonwebtoken';

// Sesión deslizante: mientras el admin siga usando el panel, cada request autenticado
// renueva el token (2h desde la última acción). Si de verdad se queda inactivo más de
// 2h, el token vence y debe iniciar sesión de nuevo.
const SESSION_WINDOW = '2h';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No autorizado: falta el token' });
  }

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    const refreshed = jwt.sign(
      { id: req.admin.id, usuario: req.admin.usuario },
      process.env.JWT_SECRET,
      { expiresIn: SESSION_WINDOW }
    );
    res.setHeader('X-Refresh-Token', refreshed);
    next();
  } catch {
    return res.status(401).json({ error: 'No autorizado: token inválido o expirado' });
  }
}
