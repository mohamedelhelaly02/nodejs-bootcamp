const express = require('express');
const { userLoginValidationSchema } = require('../validators/userLoginValidationSchema.js');
const {
    getAllUsers,
    register,
    login,
    getProfile,
    updateProfile,
    forgetPassword,
    verifyPassResetCode
} = require('../controllers/users.controller.js');
const { validateMiddleware } = require('../middlewares/validateMiddleware.js');
const { verifyToken } = require('../middlewares/verifyToken.js');
const fileUpload = require('express-fileupload');
const router = express.Router();

router.route('').get(getAllUsers);

router.route('/register').post(register);

router.route('/login').post(userLoginValidationSchema(), validateMiddleware, login);

router.route('/me/profile').get(verifyToken, getProfile);
router.route('/me/profile').put(verifyToken, fileUpload({ createParentPath: true }), updateProfile);

router.route('/forget-password').post(forgetPassword);

router.route('/verify-reset-code').post(verifyPassResetCode);

module.exports = { usersRouter: router };