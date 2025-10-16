const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config()
// Print the loaded environment variables

// Create a transporter using your Gmail credentials
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        // user: process.env.EMAIL_USER, 
        // pass: process.env.EMAIL_PASS, 
        user:"mksfood01@gmail.com",
        pass:"mdmf spse riff kdjd", 
    },
});

// Function to send email
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, 
            to,                           
            subject,                      
            html,                        
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Error sending email");
    }
};

module.exports = sendEmail;
