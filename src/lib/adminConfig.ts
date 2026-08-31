export const ROOT_ADMIN_EMAILS = [
  'egecagant@gmail.com',
  'batuhanesirger@gmail.com'
];

export const isRootAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  return ROOT_ADMIN_EMAILS.some(e => e.toLowerCase().trim() === cleanEmail);
};
