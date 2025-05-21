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
    let html;

    // Define HTML templates inline
    if (template === "welcome") {
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4f4f4; padding: 10px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Shopnix!</h1>
            </div>
            <div class="content">
              <p>Hi ${this.firstName},</p>
              <p>Thank you for joining the Shopnix family! We're excited to have you on board.</p>
              <p>Start exploring our amazing products and enjoy a seamless shopping experience.</p>
              <a class="button" href="${this.url}">Shop Now</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Shopnix. All rights reserved.</p>
              <p>If you didn’t sign up, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (template === "verifyEmail") {
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4f4f4; padding: 10px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 10px 20px; background: #28a745; color: #fff; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${this.firstName},</p>
              <p>Please verify your email address to complete your Shopnix account setup.</p>
              <p>Click the button below to verify your email. This link expires in 24 hours.</p>
              <a class="button" href="${this.url}">Verify Email</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Shopnix. All rights reserved.</p>
              <p>If you didn’t request this, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (template === "resetPassword") {
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f4f4f4; padding: 10px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 10px 20px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hi ${this.firstName},</p>
              <p>You requested to reset your Shopnix password. Click the button below to set a new password.</p>
              <p>This link expires in 10 minutes.</p>
              <a class="button" href="${this.url}">Reset Password</a>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Shopnix. All rights reserved.</p>
              <p>If you didn’t request this, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

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
    await this.send("welcome", "Welcome to the Shopnix Family!");
  }

  async sendEmailVerification() {
    await this.send("verifyEmail", "Verify Your Shopnix Account");
  }

  async sendPasswordReset() {
    await this.send("resetPassword", "Reset Your Shopnix Password");
  }
};
