const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config()
// Print the loaded environment variables

// Create a transporter using your Gmail credentials
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "jayr6741@gmail.com",  
        pass: "zhpq zowd udhv fhkv", 
        user: "jayr6741@gmail.com",  
        pass: "zhpq zowd udhv fhkv", 
    },
});

// Function to send email
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,  // sender address
            to,                            // recipient address
            subject,                       // subject line
            html,                          // html body
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Error sending email");
    }
};

module.exports = sendEmail;
