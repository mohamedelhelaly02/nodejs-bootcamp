const { body } = require('express-validator');

const userLoginValidationSchema = () => {
    return [

        body('email')
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format'),

        body('password')
            .notEmpty().withMessage('Password is required')

    ]
}

module.exports = { userLoginValidationSchema };