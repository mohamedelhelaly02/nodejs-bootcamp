const express = require('express');
const { userLoginValidationSchema } = require('../validators/userLoginValidationSchema.js');
const {
    getAllUsers,
    register,
    login,
    getProfile,
    updateProfile,
    forgetPassword,
    verifyPassResetCode,
    resetPassword,
    confirmEmail,
    resendConfirmEmail,
    refreshAccessToken,
    getActiveSessions,
    setup2FaAuthenticatorApp,
    verify2FAAuthenticatorSetup
} = require('../controllers/users.controller.js');
const { validateMiddleware } = require('../middlewares/validateMiddleware.js');
const { verifyToken } = require('../middlewares/verifyToken.js');
const fileUpload = require('express-fileupload');
const { forgetPasswordLimiter } = require('../middlewares/rateLimiter.js');
const router = express.Router();

router.route('').get(getAllUsers);

router.route('/register').post(register);

router.route('/login').post(userLoginValidationSchema(), validateMiddleware, login);

router.route('/me/profile').get(verifyToken, getProfile);
router.route('/me/profile').put(verifyToken, fileUpload({ createParentPath: true }), updateProfile);

router.route('/forget-password').post(forgetPasswordLimiter, forgetPassword);

router.route('/verify-reset-code').post(verifyPassResetCode);
router.route('/reset-password').post(resetPassword);
router.route('/confirm-email').post(confirmEmail);
router.route('/resend-confirm-email').post(resendConfirmEmail);
router.route('/refresh').post(refreshAccessToken);
router.route('/active-sessions').get(verifyToken, getActiveSessions);
router.route('/2fa/setup/app').get(verifyToken, setup2FaAuthenticatorApp);
router.route('/2fa/setup/app/verify').post(verifyToken, verify2FAAuthenticatorSetup);

module.exports = { usersRouter: router };