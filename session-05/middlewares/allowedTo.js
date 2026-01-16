const httpStatusText = require('../utils/httpStatusText.js');

const allowedTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: httpStatusText.FAIL,
                message: 'You are not allowed to access this resource'
            });
        }

        next();
    }
}

module.exports = { allowedTo };