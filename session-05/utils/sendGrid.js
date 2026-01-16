const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (payload) => {
    try {
        const mailMessage = {
            from: process.env.SG_EMAIL_USER,
            to: payload.email,
            subject: payload.subject,
            text: payload.message
        }

        const result = await sendGridMail.send(mailMessage);
        return result;
    } catch (error) {
        return error;
    }

}

module.exports = { sendEmail };