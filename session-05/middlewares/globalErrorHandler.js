const httpStatusText = require('../utils/httpStatusText');
const appError = require('../utils/appError');

const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const statusText = err.statusText || httpStatusText.ERROR;

    const error = appError.create(err.message, statusCode, statusText);

    res.status(statusCode).json(error);

}

module.exports = globalErrorHandler;