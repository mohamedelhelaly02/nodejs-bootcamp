const httpStatusText = require('../utils/httpStatusText');
const { verifyJwtToken } = require('../utils/jwt');
const appError = require('../utils/appError');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        const error = appError.create('token is required', 401, httpStatusText.FAIL);
        return next(error);
    }

    try {
        const decoded = verifyJwtToken(token);
        console.log(`decoded token: `, decoded);

        if (decoded === null) {
            return next(appError.create('Invalid or expired token', 403, httpStatusText.FAIL));
        }

        req.user = decoded; // what this means ?


        next();
    } catch (error) {
        return next(appError.create('Invalid or expired token', 403, httpStatusText.FAIL));
    }

};

module.exports = { verifyToken };