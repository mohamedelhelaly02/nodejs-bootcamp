const { getIpGeolocation } = require('../services/ipGeolocation.service');
const { sendEmail } = require('../utils/sendEmail');


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

    if (userLastLoginIP && userLastLoginIP !== currentIP) {
        const lastCountry = await getCountryFromIP(userLastLoginIP);
        const currentCountry = await getCountryFromIP(currentIP);

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


module.exports = { getCountryFromIP, checkSuspiciousLogin, sendSecurityAlert }