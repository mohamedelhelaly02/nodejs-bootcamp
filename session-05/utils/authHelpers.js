const { getIpGeolocation } = require('../services/ipGeolocation.service');
const { sendEmail } = require('../utils/sendEmail');
const speakeasy = require('speakeasy');


const getCountryFromIP = async (ip) => {
    const geoLocationResponse = await getIpGeolocation(ip);
    if (!geoLocationResponse || !geoLocationResponse.location) {
        return 'Unknown Location';
    }

    return geoLocationResponse.location.country_name || 'Unknown Location';

}

const sendSecurityAlert = async (user, data) => {
    try {
        const mailOptions = {
            from: `CodeZone-Courses App <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Security Alert: New Login Detected',
            text: `
                A new login to your account was detected from ${data.currentCountry}
                last login to your account was detected from ${data.lastCountry}

                - Time: ${data.time}
                - Device: ${data.device}
                - Location: ${data.location}
                - IP Address: ${data.ip}

                If this was not you, please secure your account immediately by changing your password.
      `.trim()
        };

        const result = await sendEmail(mailOptions);
        return result;
    } catch (error) {
        console.error('Send security alert error:', error.message);
        return error;
    }
}

const checkSuspiciousLogin = async (user, currentIP, currentDevice) => {
    const userLastLoginIP = user.security.lastLoginIP;
    console.log(userLastLoginIP);


    if (userLastLoginIP && userLastLoginIP !== currentIP) {
        const lastCountry = await getCountryFromIP(userLastLoginIP);
        const currentCountry = await getCountryFromIP(currentIP);

        console.log(lastCountry, currentCountry);

        if (lastCountry !== currentCountry) {
            const information = {
                time: new Date(),
                device: currentDevice,
                location: currentCountry,
                ip: currentIP,
                lastCountry
            }
            await sendSecurityAlert(user, information);
        }
    }

}

async function setup2FAApp(user) {
    const secret = speakeasy.generateSecret({
        name: `CodeZone-Courses App (${user.email})`,
        length: 32
    });

    user.twoFactorAuth.tempOTP = {
        code: secret.base32,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        method: 'setup',
        purpose: 'setup'
    };

    await user.save({ validateBeforeSave: false });

    return {
        otpauth_url: secret.otpauth_url
    };


}


module.exports = {
    getCountryFromIP,
    checkSuspiciousLogin,
    sendSecurityAlert,
    setup2FAApp
}