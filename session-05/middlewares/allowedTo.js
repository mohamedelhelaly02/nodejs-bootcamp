const httpStatusText = require('../utils/httpStatusText.js');
const appError = require('../utils/appError.js')

const allowedTo = (...roles) => {
    return (req, res, next) => {
        const userRoles = req.user.roles;
        const hasPermission = userRoles.some(role => roles.includes(role));

        if (!hasPermission) {
            return next(appError.create('You are not allowed to perform this action', 403, httpStatusText.FORBIDDEN));
        }

        next();
    }
}

module.exports = { allowedTo };