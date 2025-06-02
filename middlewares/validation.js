import Joi from "joi";

/**
 * @param {Joi.Schema} schema - The Joi schema to validate against.
 * @param {string} [source='body'] - The source of the data to validate ('body', 'query', 'params').
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return res.status(422).json({
        success: false,
        message: `Validation error in request ${source}`,
        errors: errorDetails,
      });
    }

    if (source === "query") {
      req.validatedQuery = value;
    } else {
      req[source] = value;
    }

    next();
  };
};
