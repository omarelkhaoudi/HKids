/**
 * Admin self-signup policy.
 * - Open when ADMIN_SIGNUP_ENABLED=true (optional ADMIN_SIGNUP_CODE).
 * - Bootstrap: first admin allowed when no admin exists yet.
 */

export function isAdminSignupCodeValid(providedCode) {
  const requiredCode = process.env.ADMIN_SIGNUP_CODE;
  if (!requiredCode) return true;
  return String(providedCode || '') === requiredCode;
}

/**
 * @param {import('pg').Pool} pool
 * @param {string | undefined} adminSignupCode
 */
export async function canRegisterAdmin(pool, adminSignupCode) {
  if (!isAdminSignupCodeValid(adminSignupCode)) {
    return {
      allowed: false,
      error: 'Code d\'inscription admin invalide',
    };
  }

  if (process.env.ADMIN_SIGNUP_ENABLED === 'true') {
    return { allowed: true };
  }

  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`
  );
  const adminCount = result.rows[0]?.count ?? 0;

  if (adminCount === 0) {
    return { allowed: true, bootstrap: true };
  }

  return {
    allowed: false,
    error: 'Admin signup is not available',
  };
}
