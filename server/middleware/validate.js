import { z } from 'zod';

/**
 * Validates request data against a Zod schema.
 * Rejects unknown fields (.strict()) and invalid types with consistent 400 and field-level errors.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Request property to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate =
        source === 'params'
          ? req.params
          : source === 'query'
          ? req.query
          : req.body;

      const parsed = schema.parse(dataToValidate);

      if (source === 'params') req.params = parsed;
      else if (source === 'query') req.query = parsed;
      else req.body = parsed;

      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const issues = err.issues || err.errors || [];
        const fieldErrors = issues.map((e) => ({
          field: (e.path && e.path.length > 0) ? e.path.join('.') : source,
          message: e.message,
          code: e.code,
        }));

        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: fieldErrors[0]?.message || 'Invalid input data',
          errors: fieldErrors,
        });
      }
      next(err);
    }
  };
};

/**
 * Standard 24-character hexadecimal MongoDB ObjectId schema
 */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format: must be a 24-character hex ObjectId');

/**
 * Validates an :id route parameter as an ObjectId
 */
export const validateIdParam = (paramName = 'id') => {
  const schema = z
    .object({
      [paramName]: objectIdSchema,
    })
    .strict();

  return validate(schema, 'params');
};

export default validate;
