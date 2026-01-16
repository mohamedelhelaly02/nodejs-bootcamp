const jwt = require('jsonwebtoken');

const generateJwtToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        roles: user.roles.map(r => r.name)
    };

    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
        issuer: process.env.JWT_VALID_ISSUER || 'http://localhost:4000',
        audience: process.env.JWT_VALID_AUDIENCE || 'http://localhost:4000',
        algorithm: process.env.JWT_ALGORITHM || 'HS256'
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

module.exports = {
    generateJwtToken,
    verifyJwtToken
};