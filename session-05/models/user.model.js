const mongoose = require('mongoose');
const validator = require('validator');

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
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
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
    },
    lastLoginAt: {
        type: Date
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    code: {
        type: String
    },
    codeExpiration: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
