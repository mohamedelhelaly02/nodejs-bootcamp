const mongoose = require('mongoose');
const httpStatusText = require('../utils/httpStatusText');

const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return next({
                statusCode: 400,
                statusText: httpStatusText.FAIL,
                message: 'Invalid ObjectId'
            });

        }

        next();

    }
}

module.exports = { validateObjectId };