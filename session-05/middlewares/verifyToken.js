const httpStatusText = require('../utils/httpStatusText');
const { verifyJwtToken } = require('../utils/jwt');
const appError = require('../utils/appError');
const User = require('../models/user.model')

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        const error = appError.create('token is required', 401, httpStatusText.FAIL);
        return next(error);
    }

    try {
        const decoded = verifyJwtToken(token);

        if (decoded === null) {
            return next(appError.create('Invalid or expired token', 403, httpStatusText.FAIL));
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return next(appError.create('User not found', 401, httpStatusText.ERROR));
        }

        if (user.passwordChangedAt) {
            const passwordChangedTime = parseInt(
                user.passwordChangedAt.getTime() / 1000,
                10
            );

            if (passwordChangedTime > decoded.iat) {
                return next(
                    appError.create('Password changed, please login again', 401, httpStatusText.ERROR)
                );
            }
        }



        req.user = decoded;


        next();
    } catch (error) {
        return next(appError.create('Invalid or expired token', 403, httpStatusText.FAIL));
    }

};

module.exports = { verifyToken };