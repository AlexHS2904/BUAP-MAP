// ── AUTH ─────────────────────────────────────────────────
const USERS = [
  { username: 'admin',   password: 'admin123', role: 'admin',  name: 'Administrador' },
  { username: 'alumno',  password: 'buap2024', role: 'user',   name: 'Alumno BUAP'   },
];

const SESSION_KEY = 'buap_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch { return null; }
}

export function login(username, password) {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return null;
  const session = { username: user.username, role: user.role, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAdmin() {
  const s = getSession();
  return s?.role === 'admin';
}
