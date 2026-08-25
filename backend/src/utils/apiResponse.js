/**
 * Standardized API Response Helpers
 */

const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(payload);
};

const sendError = (res, message = "An error occurred", statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  };
  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
