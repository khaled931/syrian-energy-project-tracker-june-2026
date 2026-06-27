export function readAllowedUsers(): string[] {
  const raw = String(import.meta.env.VITE_ALLOWED_USERS || '');
  return raw.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

export function canManage(value?: string | null): boolean {
  if (!value) return false;
  return readAllowedUsers().includes(value.toLowerCase());
}
