import {
  assertChildAccess,
  loadChildAccessPolicy,
  sendParentalAccessError
} from '../services/parental/parentalAccessService.js';

export function enforceParentalAccess({
  getKidProfileId = (req) => req.body?.kid_profile_id || req.query?.kid_profile_id,
  getContent = null
} = {}) {
  return async (req, res, next) => {
    try {
      const policy = await loadChildAccessPolicy({
        user: req.user,
        requestedKidProfileId: getKidProfileId(req)
      });
      const content = getContent ? await getContent(req, policy) : null;
      assertChildAccess(policy, content);
      req.parentalAccessPolicy = policy;
      next();
    } catch (error) {
      if (error?.isParentalAccessError) {
        return sendParentalAccessError(res, error);
      }
      console.error('Parental access check failed:', error);
      res.status(503).json({
        error: 'Le contrôle parental est momentanément indisponible.',
        code: 'POLICY_UNAVAILABLE',
        parental_restriction: true
      });
    }
  };
}
