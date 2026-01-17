const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        roles: user.roles.map(r => r.name)
    };

    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN,
        issuer: process.env.JWT_VALID_ISSUER,
        audience: process.env.JWT_VALID_AUDIENCE,
        algorithm: process.env.JWT_ALGORITHM
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
}

const verifyJwtToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
}

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
}

const generateTokens = (user) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    return { accessToken, refreshToken }
}

const getRefreshTokenExpiry = () => {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // '7d'
}

const parseUserAgent = (userAgent) => {
    const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'Mobile' : 'Desktop';

    let browser = 'Unknown';
    if (/Chrome/.test(userAgent)) browser = 'Chrome';
    else if (/Firefox/.test(userAgent)) browser = 'Firefox';
    else if (/Safari/.test(userAgent)) browser = 'Safari';
    else if (/Edge/.test(userAgent)) browser = 'Edge';

    let os = 'Unknown';
    if (/Windows/.test(userAgent)) os = 'Windows';
    else if (/Mac/.test(userAgent)) os = 'macOS';
    else if (/Linux/.test(userAgent)) os = 'Linux';
    else if (/Android/.test(userAgent)) os = 'Android';
    else if (/iOS|iPhone|iPad/.test(userAgent)) os = 'iOS';

    return { device, browser, os };
}

module.exports = {
    generateAccessToken,
    verifyJwtToken,
    generateRefreshToken,
    generateTokens,
    getRefreshTokenExpiry,
    parseUserAgent
};