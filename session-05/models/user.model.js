const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    code: {
        type: String
    },
    codeExpiration: {
        type: Date
    },
    refreshTokens: [{
        token: {
            type: String,
            required: true,
            select: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true
        },
        device: {
            type: String
        },
        browser: String,
        os: String,
        ipAddress: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return validator.isIP(v);
                },
                message: 'Invalid ip address format.'
            }
        },
        location: {
            country: String,
            city: String
        },
        lastUsedAt: {
            type: Date,
            default: Date.now
        },
        revoked: {
            type: Boolean,
            default: false
        },
        revokedAt: Date
    }],
    twoFactorAuth: {
        app: {
            enabled: {
                type: Boolean,
                default: false
            },
            secret: {
                type: String,
                select: false
            },
            backupCodes: [{
                code: {
                    type: String,
                    select: false
                },
                used: {
                    type: Boolean,
                    default: false
                },
                usedAt: Date
            }],
            enabledAt: Date,
            lastUsedAt: Date
        },

        email: {
            enabled: {
                type: Boolean,
                default: false
            },
            verifiedEmail: {
                type: String,
                validate: [validator.isEmail, 'Invalid email format.']
            },
            enabledAt: Date,
            lastUsedAt: Date
        },

        tempOTP: {
            code: {
                type: String,
                select: false
            },
            expiresAt: Date,
            attempts: {
                type: Number,
                default: 0,
                max: 5
            },
            method: {
                type: String,
                enum: ['sms', 'email', 'setup']
            },
            purpose: {
                type: String,
                enum: ['login', 'setup', 'verify', 'disable']
            }
        },

        preferredMethod: {
            type: String,
            enum: ['app', 'email'],
            default: null
        },
        mandatory: {
            type: Boolean,
            default: false
        }
    },
    security: {
        lastLoginAt: Date,
        lastLoginIP: String,
        lastLoginDevice: String,
        loginAttempts: {
            count: {
                type: Number,
                default: 0
            },
            lastAttemptAt: Date,
            lockedUntil: Date
        },
        passwordHistory: [{
            password: {
                type: String,
                select: false
            },
            changedAt: {
                type: Date,
                default: Date.now
            }
        }],
        suspiciousActivity: [{
            type: {
                type: String,
                enum: ['failed_login', 'password_reset', 'unusual_location', '2fa_disabled']
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            ipAddress: String,
            details: mongoose.Schema.Types.Mixed
        }],
        trustedDevices: [{
            fingerprint: String,
            name: String,
            addedAt: {
                type: Date,
                default: Date.now
            },
            lastUsedAt: Date
        }]
    }
}, { timestamps: true });

// virtual fields
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
})

userSchema.virtual('has2FAEnabled').get(function () {
    return this.twoFactorAuth.app.enabled ||
        this.twoFactorAuth.email.enabled;
})

userSchema.virtual('activeTokensCount').get(function () {
    return this.refreshTokens.filter(rt => rt.expiresAt > new Date()).length;
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.addRefreshToken = async function (tokenData) {
    this.refreshTokens.push({
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        device: tokenData.device,
        browser: tokenData.browser,
        os: tokenData.os,
        ipAddress: tokenData.ipAddress,
        location: tokenData.location
    });

    await this.save({ validateBeforeSave: false });
}


userSchema.methods.revokeRefreshToken = async function (token) {
    const tokenDoc = this.refreshTokens.find(t => t.token === token);
    if (tokenDoc) {
        tokenDoc.revoked = true;
        tokenDoc.revokedAt = Date.now();
        await this.save({ validateBeforeSave: false });
        return true;
    }
    return false;
}

userSchema.methods.incrementLoginAttempts = async function () {
    if (this.security.loginAttempts.lockedUntil &&
        this.security.loginAttempts.lockedUntil < Date.now()) {
        this.security.loginAttempts.count = 1;
        this.security.loginAttempts.lockedUntil = undefined;
    } else {
        this.security.loginAttempts.count += 1;
    }

    this.security.loginAttempts.lastAttemptAt = Date.now();

    if (this.security.loginAttempts.count >= 5) {
        this.security.loginAttempts.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 min
    }

    await this.save({ validateBeforeSave: false });
};

userSchema.methods.isAccountLocked = function () {
    return this.security.loginAttempts.lockedUntil &&
        this.security.loginAttempts.lockedUntil > Date.now();
}

module.exports = mongoose.model('User', userSchema);
