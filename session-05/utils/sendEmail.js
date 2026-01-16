const nodemailer = require("nodemailer");


const sendEmail = async (options) => {
    try {
        // Create a transporter - Configure your SMTP server or another supported transport method.
        const transporter = nodemailer.createTransport({
            host: process.env.GMAIL_HOST,
            port: process.env.GMAIL_PORT,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Compose your message - Define the sender, recipient(s), subject, and content.

        const mailOpts = {
            from: `CodeZone-Courses App <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message
        }

        // Send the email - Call transporter.sendMail() with your message options.

        const result = await transporter.sendMail(mailOpts);

        return result;
    } catch (error) {
        return error;
    }

}

module.exports = { sendEmail };

