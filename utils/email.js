// Email utility for sending emails using Nodemailer and SendGrid
const nodemailer = require("nodemailer");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.fullName.split(" ")[0];
    this.url = url;
    this.from = `InkWell Support <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // gmail configuration
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }

    // Development: Mailtrap or similar
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    let bodyContent = "";

    if (template === "welcome") {
      bodyContent = `
        <p>Hi ${this.firstName},</p>
        <p>Thank you for joining the InkWell family! We're excited to have you on board.</p>
        <p>Start exploring our amazing products and enjoy a seamless experience.</p>
        <a href="${this.url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Shop Now</a>
      `;
    } else if (template === "verifyEmail") {
      bodyContent = `
        <p>Hi ${this.firstName},</p>
        <p>Please verify your email address to complete your InkWell account setup.</p>
        <p>This link expires in 24 hours.</p>
        <a href="${this.url}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
      `;
    } else if (template === "resetPassword") {
      bodyContent = `
        <p>Hi ${this.firstName},</p>
        <p>You requested to reset your InkWell password.</p>
        <p>This link expires in 10 minutes.</p>
        <a href="${this.url}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
      `;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f2f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 640px; margin: auto;">
        <tr>
          <td style="padding: 40px 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #333;">${subject}</h1>
          </td>
        </tr>
    
        <tr>
          <td style="background: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a; margin-top: 0;">
              Hi ${this.firstName},
            </p>
    
            <p style="font-size: 16px; line-height: 1.6; color: #4a4a4a;">
              ${
                template === "welcome"
                  ? `Thank you for joining the InkWell family! We're thrilled to have you onboard.`
                  : template === "verifyEmail"
                  ? `Please verify your email to activate your InkWell account. This link is only valid for 24 hours.`
                  : `You requested to reset your password. Click below to set a new one. This link expires in 10 minutes.`
              }
            </p>
    
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.url}" style="background-color: ${
      template === "welcome"
        ? "#007bff"
        : template === "verifyEmail"
        ? "#28a745"
        : "#dc3545"
    }; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block; font-size: 16px;">
                ${
                  template === "welcome"
                    ? "Get Started"
                    : template === "verifyEmail"
                    ? "Verify Email"
                    : "Reset Password"
                }
              </a>
            </div>
    
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </td>
        </tr>
    
        <tr>
          <td style="text-align: center; font-size: 12px; color: #999; padding: 20px 0;">
            &copy; ${new Date().getFullYear()} InkWell. All rights reserved.
          </td>
        </tr>
      </table>
    
    </body>
    </html>
    `;

    // Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    //Create Transport and Send the email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the InkWell Family!");
  }

  async sendEmailVerification() {
    await this.send("verifyEmail", "Verify Your InkWell Account");
  }

  async sendPasswordReset() {
    await this.send("resetPassword", "Reset Your InkWell Password");
  }
};
