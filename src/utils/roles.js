// Single source of truth for role naming.
// Internally we use the MVP doc's terminology: admin / trainer / user.
// Legacy backend uses: admin / teacher / student. We normalise on read.

export function normalizeRole(role) {
  if (!role) return null;
  if (role === 'student') return 'user';
  if (role === 'teacher') return 'trainer';
  return role;
}

export function roleLabel(role) {
  const r = normalizeRole(role);
  return { admin: 'Admin', trainer: 'Trainer', user: 'Student' }[r] || r;
}

// "Does this user's role satisfy any of `allowed`?" — accepts both naming systems.
export function hasRole(userRole, allowed) {
  if (!userRole || !allowed) return false;
  const r = normalizeRole(userRole);
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.map(normalizeRole).includes(r);
}
