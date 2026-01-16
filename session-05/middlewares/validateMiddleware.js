const { validationResult } = require('express-validator');

const httpStatusText = require('../utils/httpStatusText');

const validateMiddleware = (req, res, next) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        return res.status(422).json({
            status: httpStatusText.FAIL,
            data: {
                errors: validationErrors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            }
        });
    }

    next();
}

module.exports = { validateMiddleware };