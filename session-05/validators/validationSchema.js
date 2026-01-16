const { body } = require('express-validator');

const validationSchema = () => {
    return [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long')
            .isLength({ max: 100 }).withMessage('Name must be at most 100 characters long'),
        body('price')
            .notEmpty().withMessage('Price is required')
            .isFloat({ gt: 0, lt: 10000 }).withMessage('Price must be a number between 1 and 10,000')
    ]
};

module.exports = { validationSchema };