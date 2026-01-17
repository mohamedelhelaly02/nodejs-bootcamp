const asyncWrapper = require('../middlewares/asyncWrapper');
const User = require('../models/user.model');
const httpStatusText = require('../utils/httpStatusText');
const { paginateResponse } = require('../utils/paginateResponse');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateTokens, getRefreshTokenExpiry, parseUserAgent } = require('../utils/jwt')
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail')
const appError = require('../utils/appError')
const Role = require('../models/role.model')
const userRoles = require('../utils/userRoles')

// profile

const getProfile = asyncWrapper((req, res) => {
    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { user: req.user }
    });
});


// Get all users

const getAllUsers = asyncWrapper(async (req, res, next) => {
    const { limit, page, skip, totalItems, totalPages } = await paginateResponse(req, User);
    const users = await User.find({}, '-password -__v')
        .skip(skip)
        .limit(limit);

    var mappedUsers = users.map(user => ({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        avatar: user.avatar ? `${req.protocol}://${req.get('host')}/${user.avatar}` : null,
    }))

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { users: mappedUsers },
        pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            perPage: limit
        }
    });
});


const register = asyncWrapper(async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Email already in use'
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = await Role.findOne({ name: userRoles.USER })

    if (!defaultRole) {
        return next(appError.create(`Role not existes '${userRoles.USER}'`, 500, httpStatusText.FAIL));
    }

    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        emailConfirmed: false,
        roles: [defaultRole._id]
    });


    const confirmEmailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256')
        .update(confirmEmailCode)
        .digest('hex');

    newUser.code = hashedCode;
    newUser.codeExpiration = Date.now() + 10 * 60 * 1000;


    await newUser.save();

    // send email

    try {
        const message = `
            Hi ${newUser.firstName} ${newUser.lastName},

            Thank you for registering at CodeZone-Courses.

            Please confirm your email address using the code below:

            Your confirmation code: ${confirmEmailCode}

            ⚠️ This code is valid for 10 minutes.

            If you did not register, please ignore this email.

            Thank you,
            The CodeZone-Courses Team
            `;

        await sendEmail({
            email: newUser.email,
            subject: 'Email Confirmation Code',
            message: message
        })
    } catch (error) {
        return next(appError.create(error.message, 500, httpStatusText.FAIL));
    }


    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        message: 'Confirm email required, check your inbox.'
    });

});

const login = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;

    const user = await User.findOne({ email }).populate('roles');

    if (!user) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid email or password'
        });
    }

    // check if account locked

    if (user.isAccountLocked()) {
        return next(appError.create(`Your account locked until ${user.security?.loginAttempts?.lockedUntil.toDateString()}`, 423, httpStatusText.FAIL))
    }


    if (!user.emailConfirmed) {
        return next(appError.create('Email not confirmed.', 400, httpStatusText.FAIL));
    }

    const isPasswordValid = await user.comparePassword(password); // schema method

    if (!isPasswordValid) {

        await user.incrementLoginAttempts();

        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid email or password'
        });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const { device, browser, os } = parseUserAgent(userAgent);

    // save refresh token in db

    await user.addRefreshToken({
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
        device,
        browser,
        os,
        ipAddress
    })

    user.lastLoginAt = Date.now();

    await user.save();



    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Login Success',
        data: {
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                avatar: user.avatar
            },
            accessToken,
            refreshToken
        }
    });

});


const updateProfile = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;
    const avatarFile = req.files ? req.files.avatar : null;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (avatarFile) {
        const avatarPath = `uploads/${Date.now()}_${avatarFile.name}`;
        await avatarFile.mv(avatarPath);
        updateData.avatar = avatarPath;
    }

    const updatedUser = await User.findByIdAndUpdate({ _id: userId }, updateData, { new: true, select: '-password -__v' });

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { user: updatedUser }
    });
})

const forgetPassword = asyncWrapper(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'No user found with this email'
        });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.passwordResetCode = hashedResetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.passwordResetVerifed = false;

    await user.save();

    // send reset-code to email user

    const message = `Hi ${user.firstName},\n We received a request to reset the password on your CodeZone-Courses.\n ${resetCode} \n Enter this code to complete the reset.`;

    const emailResponse = await sendEmail({
        email: user.email,
        subject: 'Your password reset code (Valid for 10 min)',
        message: message
    });

    console.log(emailResponse);


    return res.status(200).json({ status: 'success', message: 'Reset code sent to the email' })



});

const verifyPassResetCode = asyncWrapper(async (req, res, next) => {
    // Get user based on reset code
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(req.body.resetCode)
        .digest('hex');

    const user = await User.findOne({
        passwordResetCode: hashedResetCode,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(appError.create(
            'Invalid password reset code or expired', 400, httpStatusText.ERROR))
    }

    user.passwordResetVerifed = true;

    await user.save();

    return res.status(200).json({ status: httpStatusText.SUCCESS, message: 'Code Verified.' })

})

const resetPassword = asyncWrapper(async (req, res, next) => {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(appError.create(`There is no user with email '${email}'`, 404, httpStatusText.FAIL));
    }

    // check if the resetCode verified

    if (!user.passwordResetVerifed) {
        return next(appError.create(`Code not verified.`, 400, httpStatusText.FAIL))
    }

    var hashedPassword = crypto
        .createHash('sha256')
        .update(newPassword)
        .digest('hex');

    user.password = hashedPassword;
    user.passwordChangedAt = Date.now();
    user.passwordResetCode = undefined;
    user.passwordResetVerifed = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    const token = generateJwtToken(user);

    return res.status(200).json({ status: httpStatusText.SUCCESS, data: { token } });

});

const confirmEmail = asyncWrapper(async (req, res, next) => {
    const hashedCode = crypto.createHash('sha256').update(req.body.code).digest('hex');
    const user = await User.findOne({ email: req.body.email, code: hashedCode, codeExpiration: { $gt: Date.now() } });

    if (!user) {
        return next(appError.create(
            'Incorrect code or expired', 400, httpStatusText.ERROR))
    }

    if (user.emailConfirmed) {
        return next(appError.create('Email already confirmed.', 400, httpStatusText.ERROR));
    }

    user.emailConfirmed = true;
    user.code = undefined;
    user.codeExpiration = undefined;
    await user.save();

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'Email confirmed successfully'
    });

});

const resendConfirmEmail = asyncWrapper(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return next(appError.create('User not found', 404, httpStatusText.FAIL));
    }

    if (user.emailConfirmed) {
        return next(appError.create('Email already confirmed', 400, httpStatusText.FAIL));
    }

    const confirmEmailCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto
        .createHash('sha256')
        .update(confirmEmailCode)
        .digest('hex');

    user.code = hashedCode;
    user.codeExpiration = Date.now() + 10 * 60 * 1000;

    await user.save();

    const message = `
        Hi ${user.firstName} ${user.lastName},

        You requested a new email confirmation code.

        Your new confirmation code is:
        ${confirmEmailCode}

        ⚠️ This code is valid for 10 minutes.

        If you did not request this, please ignore this email.

        CodeZone-Courses Team
        `;

    await sendEmail({
        email: user.email,
        subject: 'New Email Confirmation Code',
        message
    });

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: 'A new confirmation code has been sent to your email.'
    });
});


const refreshAccessToken = asyncWrapper(async (req, res, next) => {
    // Get refresh token
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return next(appError.create('refresh token is required.', 400, httpStatusText.FAIL));
    }

    // Get the user owns that refresh token
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });

    if (!user) {
        return next(appError.create('Invalid refresh token', 403, httpStatusText.FAIL));
    }

    const tokenPayload = user.refreshTokens.find(rt => rt.token === refreshToken);

    if (!tokenPayload || tokenPayload.expiresAt < new Date()) {
        // refresh token is expired
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);

        await user.save();

        return next(appError.create('Refresh token is expired.', 403, httpStatusText.FAIL));

    }

    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({ status: httpStatusText.SUCCESS, data: { accessToken: newAccessToken } });

});

const getActiveSessions = async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId).select('refreshTokens');

    const activeSessions = user.refreshTokens.filter(rt => rt.expiresAt > new Date());

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: {
            sessions: activeSessions.map(session => ({
                device: session.device,
                ipAddress: session.ipAddress,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt
            }))
        }
    });
};

module.exports = {
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
    getActiveSessions
};

// Other endpoints for users
// /api/v1/users/forgot-password  -> POST  -> forgotPassword
// /api/v1/users/reset-password  -> POST  -> resetPassword