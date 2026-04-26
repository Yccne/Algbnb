const createHttpError = (status, message, extra = {}) => {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, extra);
  return error;
};

const badRequest = (message, extra) => createHttpError(400, message, extra);
const unauthorized = (message, extra) => createHttpError(401, message, extra);
const forbidden = (message, extra) => createHttpError(403, message, extra);
const notFound = (message, extra) => createHttpError(404, message, extra);
const conflict = (message, extra) => createHttpError(409, message, extra);
const unavailable = (message, extra) => createHttpError(503, message, extra);

module.exports = {
  createHttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unavailable,
};
