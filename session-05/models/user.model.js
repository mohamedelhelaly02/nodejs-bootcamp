const mongoose = require('mongoose');
const validator = require('validator');
const userRoles = require('../utils/userRoles.js');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, 'Invalid email']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [userRoles.ADMIN, userRoles.USER, userRoles.MANAGER],
        default: userRoles.USER
    },
    avatar: {
        type: String,
        default: 'uploads/profile.png'
    },
    passwordResetCode: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    passwordChangedAt: {
        type: Date
    },
    passwordResetVerifed: {
        type: Boolean
    }
});

module.exports = mongoose.model('User', userSchema);
