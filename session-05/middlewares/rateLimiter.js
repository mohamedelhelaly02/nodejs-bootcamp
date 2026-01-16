const rateLimit = require('express-rate-limit');

const forgetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        status: 'fail',
        message: 'Too many password reset requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
})

module.exports = {
    forgetPasswordLimiter
}