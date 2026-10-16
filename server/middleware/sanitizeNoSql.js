/**
 * NoSQL Injection Protection Middleware
 * Recursively removes any keys starting with '$' or containing '.' from req.body, req.query, and req.params.
 * Protects MongoDB queries from operator injection attacks (e.g. {"$gt": ""}, {"$where": "..."}).
 */

const sanitizeObject = (target) => {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeObject(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
      continue;
    }
    target[key] = sanitizeObject(target[key]);
  }

  return target;
};

export const sanitizeNoSql = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  next();
};

export default sanitizeNoSql;
