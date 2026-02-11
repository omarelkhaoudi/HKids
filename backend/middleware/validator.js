/**
 * Request Validation Middleware
 * Validates request data before processing
 */

/**
 * Validates required fields in request body
 */
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Validates file upload
 */
export const validateFile = (fieldName, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    const file = req.file || (req.files && req.files[fieldName]?.[0]);
    
    if (!file) {
      return next(); // File is optional
    }
    
    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
    
    // Check file size
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      });
    }
    
    next();
  };
};

/**
 * Validates age group range
 */
export const validateAgeGroup = (req, res, next) => {
  const { age_group_min, age_group_max } = req.body;
  
  if (age_group_min !== undefined && age_group_max !== undefined) {
    const min = parseInt(age_group_min);
    const max = parseInt(age_group_max);
    
    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({
        success: false,
        error: 'Age group must be valid numbers'
      });
    }
    
    if (min < 0 || max > 18) {
      return res.status(400).json({
        success: false,
        error: 'Age group must be between 0 and 18'
      });
    }
    
    if (min > max) {
      return res.status(400).json({
        success: false,
        error: 'Minimum age cannot be greater than maximum age'
      });
    }
  }
  
  next();
};

/**
 * Sanitizes string input
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Sanitizes request body strings
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
};

