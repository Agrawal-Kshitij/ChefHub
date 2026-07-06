import crypto from 'crypto';
import User from '../models/User.js';
import { getPendingRegistration, deletePendingRegistration, storePendingRegistration, pendingRegistrations } from '../auth/authController.js';
import { logger } from '../utils/logger.js';
import { sendTransactionalEmail } from '../utils/brevoEmailService.js';

// Send verification email with OTP using Brevo
export const sendVerificationEmail = async (user, verificationOTP) => {
  try {
    logger.debug('[OTP_EMAIL] Starting OTP email send process', { 
      userEmail: user.email,
      userName: user.name,
      timestamp: new Date().toISOString()
    });

    const fromEmail = process.env.BREVO_FROM_EMAIL || 'bhashkarkumar2063@gmail.com';
    const fromName = process.env.BREVO_FROM_NAME || 'ChefHub';

    logger.debug('[OTP_EMAIL] Brevo config loaded', {
      fromEmail,
      fromName,
      toEmail: user.email,
      toName: user.name
    });
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">
                🍽️ ChefHub
              </h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Your Culinary Journey Awaits
              </p>
            </div>
            
            <!-- Content -->
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                Welcome to ChefHub, ${user.name}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Thank you for registering with ChefHub. Please use the verification code below to complete your registration:
              </p>
              
              <!-- Verification OTP -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #f97316, #fb923c); padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                  <p style="color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${verificationOTP}</p>
                </div>
              </div>
              
              <p style="margin: 20px 0; font-size: 14px; color: #6b7280; text-align: center;">
                Enter this code on the verification page to activate your account.
              </p>
              
              <!-- Warning Box -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0; border-radius: 0 6px 6px 0;">
                <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 14px;">
                  ⏰ Important: This verification code expires in <strong>10 minutes</strong>
                </p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #92400e;">
                  If you don't verify within this time, you'll need to register again.
                </p>
              </div>
              
              <p style="margin: 25px 0 0 0; font-size: 14px; color: #6b7280;">
                If you didn't create an account with ChefHub, you can safely ignore this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 25px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
                Need help? Contact us at support@chefhub.com
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ChefHub. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    logger.debug('[OTP_EMAIL] Email content prepared', {
      userEmail: user.email,
      htmlLength: htmlContent?.length || 0
    });

    logger.info('[OTP_EMAIL] Sending OTP email via Brevo', {
      toEmail: user.email,
      toName: user.name,
      subject: '🔐 Verify Your ChefHub Account'
    });

    const result = await sendTransactionalEmail({
      to: [{ email: user.email, name: user.name }],
      subject: '🔐 Verify Your ChefHub Account',
      htmlContent,
      textContent: `Your ChefHub verification code is ${verificationOTP}. Enter it on the verification page. This code expires in 10 minutes.`
    });

    logger.info('[OTP_EMAIL] ✅ Email sent successfully', {
      userEmail: user.email,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('[OTP_EMAIL] ❌ Email sending failed', {
      userEmail: user?.email,
      error: error.message,
      errorCode: error.code,
      errorStatus: error.status,
      errorResponse: error.response?.data || error.response?.text || 'No response data',
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
    throw error;
  }
};

// Verify email OTP and create user
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    logger.info('[VERIFY_OTP] Email verification request received', {
      email,
      otpLength: otp?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!email || !otp) {
      logger.warn('[VERIFY_OTP] Missing email or OTP', {
        hasEmail: !!email,
        hasOtp: !!otp
      });
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    logger.debug('[VERIFY_OTP] Fetching pending registration', { email });

    // Get pending registration data from Redis (or fallback to in-memory)
    let pendingData;
    try {
      pendingData = await getPendingRegistration(email);
      logger.debug('[VERIFY_OTP] Pending data retrieved from Redis', { 
        email, 
        hasPendingData: !!pendingData 
      });
    } catch (redisError) {
      logger.warn('[VERIFY_OTP] Redis fetch failed, using in-memory fallback', {
        email,
        error: redisError.message
      });
      pendingData = pendingRegistrations.get(email);
      logger.debug('[VERIFY_OTP] Checked in-memory store', { 
        email, 
        hasPendingData: !!pendingData 
      });
    }
    
    if (!pendingData) {
      logger.error('[VERIFY_OTP] No pending registration found', { email });
      return res.status(400).json({ 
        success: false,
        message: 'No pending registration found. Please register again.'
      });
    }

    // Check if OTP expired
    if (pendingData.expiresAt < Date.now()) {
      logger.warn('[VERIFY_OTP] OTP expired', {
        email,
        expiresAt: new Date(pendingData.expiresAt).toISOString(),
        now: new Date().toISOString()
      });
      try {
        await deletePendingRegistration(email);
      } catch {
        pendingRegistrations.delete(email);
      }
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired. Please register again.',
        expired: true
      });
    }

    // Hash the entered OTP and compare
    const hashedOTP = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    
    logger.debug('[VERIFY_OTP] OTP comparison', {
      email,
      inputOtpHash: hashedOTP.substring(0, 10) + '***',
      storedOtpHash: pendingData.otp.substring(0, 10) + '***',
      match: hashedOTP === pendingData.otp
    });

    if (hashedOTP !== pendingData.otp) {
      logger.warn('[VERIFY_OTP] Incorrect OTP entered', { email });
      return res.status(400).json({ 
        success: false,
        message: 'Incorrect OTP. Please check your email and try again.'
      });
    }

    // OTP is correct - Now create the user in database
    logger.info('[VERIFY_OTP] OTP verified, creating user', { email });
    
    const newUser = new User({
      name: pendingData.name,
      email: pendingData.email,
      password: pendingData.password,
      isEmailVerified: true // User is verified since OTP matched
    });
    
    await newUser.save();
    
    logger.info('[VERIFY_OTP] ✅ User created in database', {
      email,
      userId: newUser._id
    });

    // Remove from pending registrations (Redis or in-memory)
    try {
      await deletePendingRegistration(email);
    } catch {
      pendingRegistrations.delete(email);
    }
    
    res.json({ 
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    logger.error('[VERIFY_OTP] Email verification error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error during verification' 
    });
  }
};

// Send review reminder email after booking completion
export const sendReviewReminderEmail = async (userEmail, userName, chefName, bookingId) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">
                🍽️ ChefHub
              </h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Share Your Experience
              </p>
            </div>
            
            <!-- Content -->
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
                How was your experience, ${userName}? ⭐
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Thank you for choosing <strong>${chefName}</strong> through ChefHub! We hope you had an amazing culinary experience.
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                Your feedback helps other food lovers find the perfect chef and helps chefs improve their services. You have <strong>48 hours</strong> to share your review.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${frontendUrl}/add-testimonial?bookingId=${bookingId}" 
                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f97316, #fb923c); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                  ⭐ Write Your Review
                </a>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⏰ Time Sensitive:</strong> You can submit your review within 48 hours of your booking completion. After that, the review window will expire.
                </p>
              </div>
              
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #6b7280;">
                Best regards,<br>
                <strong style="color: #f97316;">The ChefHub Team</strong>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #1f2937; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                This is an automated email from ChefHub. Please do not reply directly to this message.
              </p>
              <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} ChefHub. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

    const textContent = `Hi ${userName},\n\nThank you for using ChefHub. Please share your review for ${chefName} here: ${frontendUrl}/add-testimonial?bookingId=${bookingId}\n\nThank you!\nThe ChefHub Team`;

    await sendTransactionalEmail({
      to: [{ email: userEmail, name: userName }],
      subject: `⭐ Rate Your Experience with ${chefName}`,
      htmlContent,
      textContent
    });
  } catch (error) {
    throw error;
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    logger.info('[RESEND_OTP] Resend OTP requested', {
      email,
      timestamp: new Date().toISOString()
    });

    if (!email) {
      logger.warn('[RESEND_OTP] Missing email address');
      return res.status(400).json({ 
        success: false,
        message: 'Email address is required' 
      });
    }

    logger.debug('[RESEND_OTP] Fetching pending registration', { email });

    // Check if there's a pending registration (Redis or in-memory)
    let pendingData;
    try {
      pendingData = await getPendingRegistration(email);
      logger.debug('[RESEND_OTP] Pending data retrieved from Redis', { 
        email, 
        hasPendingData: !!pendingData 
      });
    } catch (redisError) {
      logger.warn('[RESEND_OTP] Redis fetch failed, using in-memory fallback', {
        email,
        error: redisError.message
      });
      pendingData = pendingRegistrations.get(email);
      logger.debug('[RESEND_OTP] Checked in-memory store', { 
        email, 
        hasPendingData: !!pendingData 
      });
    }
    
    if (!pendingData) {
      logger.error('[RESEND_OTP] No pending registration found', { email });
      return res.status(404).json({ 
        success: false,
        message: 'No pending registration found. Please register again.' 
      });
    }

    logger.debug('[RESEND_OTP] Generating new OTP', { email });

    // Generate new OTP (6-digit, 10-minute expiry)
    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(verificationOTP).digest('hex');

    // Update pending registration with new OTP (Redis or in-memory)
    pendingData.otp = hashedOTP;
    pendingData.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    logger.debug('[RESEND_OTP] Storing updated pending registration', {
      email,
      expiresAt: new Date(pendingData.expiresAt).toISOString()
    });

    try {
      await storePendingRegistration(email, pendingData);
      logger.debug('[RESEND_OTP] Successfully stored in Redis', { email });
    } catch (redisError) {
      logger.warn('[RESEND_OTP] Redis store failed, using in-memory fallback', {
        email,
        error: redisError.message
      });
      pendingRegistrations.set(email, pendingData);
    }

    logger.info('[RESEND_OTP] Sending verification email', { email });

    // Send new verification email
    await sendVerificationEmail({ name: pendingData.name, email }, verificationOTP);

    logger.info('[RESEND_OTP] ✅ New OTP sent successfully', {
      email,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true,
      message: 'New verification code sent! Please check your email.' 
    });

  } catch (error) {
    logger.error('[RESEND_OTP] Error resending verification email', {
      email: req.body?.email,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false,
      message: 'Failed to resend verification email' 
    });
  }
};