const asyncWrapper = require('../middlewares/asyncWrapper');
const User = require('../models/user.model');
const httpStatusText = require('../utils/httpStatusText');
const { paginateResponse } = require('../utils/paginateResponse');
const bcrypt = require('bcryptjs');
const { generateJwtToken } = require('../utils/jwt')
const { getCurrentIP } = require('../utils/ip');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail')
const appError = require('../utils/appError')

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
        role: user.role,
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
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Email already in use'
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ firstName, lastName, email, password: hashedPassword, role });

    await newUser.save();

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: { token: generateJwtToken(newUser, getCurrentIP(req)) }
    });

});

const login = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid email or password'
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({
            status: httpStatusText.FAIL,
            message: 'Invalid email or password'
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { token: generateJwtToken(user) }
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

module.exports = {
    getAllUsers,
    register,
    login,
    getProfile,
    updateProfile,
    forgetPassword,
    verifyPassResetCode,
    resetPassword
};

// Other endpoints for users
// /api/v1/users/forgot-password  -> POST  -> forgotPassword
// /api/v1/users/reset-password  -> POST  -> resetPassword