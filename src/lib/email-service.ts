import nodemailer from 'nodemailer'

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}

// Create reusable transporter
const transporter = nodemailer.createTransport(EMAIL_CONFIG)

// Verify connection configuration
async function verifyEmailService() {
  try {
    await transporter.verify()
    console.log('✅ Email service is ready')
    return true
  } catch (error) {
    console.error('❌ Email service verification failed:', error)
    return false
  }
}

// Email templates
const getWelcomeEmailTemplate = (firstName: string) => ({
  subject: `Welcome to Sycamore Church, ${firstName}! 🙏`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Sycamore Church!</h1>
        <p>We're excited to have you in our community</p>
      </div>
      <div class="content">
        <h2>Hello ${firstName}! 👋</h2>
        <p>Thank you for joining the Sycamore Church community. We're thrilled to have you as part of our family!</p>
        
        <p>Here's what you can do next:</p>
        <ul>
          <li>📱 Download our mobile app to stay connected</li>
          <li>🙏 Join us for Sunday service</li>
          <li>👥 Connect with our communities</li>
          <li>📚 Explore our devotionals and resources</li>
        </ul>
        
        <p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>
        
        <p>Blessings,<br>The Sycamore Church Team</p>
      </div>
      <div class="footer">
        <p>Sycamore Church | Building Lives, Impacting Communities</p>
      </div>
    </body>
    </html>
  `,
  text: `Welcome to Sycamore Church, ${firstName}! We're excited to have you in our community. Thank you for joining us!`
})

const getPasswordResetEmailTemplate = (firstName: string, resetUrl: string) => ({
  subject: 'Reset Your Sycamore Church Account Password 🔑',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Password Reset Request</h1>
        <p>Reset your Sycamore Church account password</p>
      </div>
      <div class="content">
        <h2>Hello ${firstName},</h2>
        <p>We received a request to reset your password for your Sycamore Church account.</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset My Password</a>
        </div>
        
        <div class="warning">
          <strong>⏰ Important:</strong> This reset link will expire in 15 minutes for security reasons.
        </div>
        
        <p><strong>If you didn't request this password reset:</strong></p>
        <ul>
          <li>You can safely ignore this email</li>
          <li>Your password will remain unchanged</li>
          <li>Contact us if you have concerns about account security</li>
        </ul>
        
        <p>For security, we recommend using a strong password that includes a mix of letters, numbers, and symbols.</p>
        
        <p>Blessings,<br>The Sycamore Church Team</p>
      </div>
      <div class="footer">
        <p>Sycamore Church | Building Lives, Impacting Communities</p>
        <p>If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
        <small>${resetUrl}</small></p>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${firstName}, we received a request to reset your password. Click this link to reset: ${resetUrl} (expires in 15 minutes)`
})

const getTempPasswordEmailTemplate = (firstName: string, email: string, tempPassword: string) => ({
  subject: 'Your Sycamore Church Account is Ready! 🎉',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; border: 2px solid #667eea; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .password { font-family: monospace; font-size: 18px; font-weight: bold; color: #667eea; background: #f0f0f0; padding: 10px; border-radius: 3px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Your Account is Ready!</h1>
        <p>Welcome to the Sycamore Church community</p>
      </div>
      <div class="content">
        <h2>Hello ${firstName}! 👋</h2>
        <p>Great news! Your Sycamore Church account has been created and you can now access both our mobile app and admin dashboard.</p>
        
        <div class="credentials">
          <h3>🔑 Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong></p>
          <div class="password">${tempPassword}</div>
        </div>
        
        <div class="warning">
          <strong>🔒 Security Notice:</strong> You will be required to change this password when you first log in.
        </div>
        
        <h3>What you can do:</h3>
        <ul>
          <li>📱 Log in to our mobile app with these credentials</li>
          <li>💻 Access the admin dashboard (if you have permissions)</li>
          <li>👤 Complete your profile information</li>
          <li>🏠 Join communities and connect with others</li>
        </ul>
        
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Log in with the credentials above</li>
          <li>Change your password to something secure and memorable</li>
          <li>Complete your profile information</li>
          <li>Explore the features available to you</li>
        </ol>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        
        <p>Blessings,<br>The Sycamore Church Team</p>
      </div>
      <div class="footer">
        <p>Sycamore Church | Building Lives, Impacting Communities</p>
        <p><small>Keep this email safe until you've changed your password</small></p>
      </div>
    </body>
    </html>
  `,
  text: `Hello ${firstName}! Your Sycamore Church account is ready. Email: ${email}, Temporary Password: ${tempPassword}. Please change this password when you first log in.`
})

// Email sending functions
export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  try {
    const template = getWelcomeEmailTemplate(firstName)
    
    const mailOptions = {
      from: `"Sycamore Church" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Welcome email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Welcome email failed:', error)
    throw error
  }
}

export async function sendPasswordResetEmail(email: string, firstName: string, resetUrl: string): Promise<boolean> {
  try {
    const template = getPasswordResetEmailTemplate(firstName, resetUrl)
    
    const mailOptions = {
      from: `"Sycamore Church" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Password reset email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Password reset email failed:', error)
    throw error
  }
}

export async function sendTempPasswordEmail(email: string, firstName: string, tempPassword: string): Promise<boolean> {
  try {
    const template = getTempPasswordEmailTemplate(firstName, email, tempPassword)
    
    const mailOptions = {
      from: `"Sycamore Church" <${process.env.SMTP_USER}>`,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Temporary password email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Temporary password email failed:', error)
    throw error
  }
}

export async function sendVerificationEmail(email: string, verificationCode: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"Sycamore Church" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Sycamore Church Account ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verify Your Account</h2>
          <p>Please use this verification code to complete your registration:</p>
          <div style="font-size: 24px; font-weight: bold; color: #667eea; padding: 20px; background: #f0f0f0; text-align: center; border-radius: 5px;">
            ${verificationCode}
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
      text: `Your verification code is: ${verificationCode}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Verification email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('❌ Verification email failed:', error)
    throw error
  }
}

// Initialize email service
export async function initializeEmailService() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.')
    return false
  }
  
  return await verifyEmailService()
}
