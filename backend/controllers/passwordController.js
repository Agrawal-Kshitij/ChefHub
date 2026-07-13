import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendTransactionalEmail } from '../utils/brevoEmailService.js';

// Request password reset
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account exists with this email, a password reset link will be sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Send password reset email using Brevo helper
    try {
      const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🍽️ ChefHub</h1>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Password Reset Request</h2>
                <p>Hi ${user.name},</p>
                <p>We received a request to reset your password for your ChefHub account. Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f97316, #fb923c); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Your Password</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
                <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 13px; word-break: break-all;">${resetUrl}</p>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0; border-radius: 0 6px 6px 0;">
                  <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 14px;">
                    ⏰ Important: This link expires in <strong>10 minutes</strong>
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <p>Best regards,<br>The ChefHub Team</p>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} ChefHub. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

      const textContent = `Hi ${user.name},\n\nWe received a request to reset your password for your ChefHub account. Use the link below to reset it:\n\n${resetUrl}\n\nThis link expires in 10 minutes. If you did not request this, please ignore this email.\n\n-- The ChefHub Team`;

      await sendTransactionalEmail({
        to: [{ email: user.email, name: user.name }],
        subject: '🔐 Reset Your ChefHub Password',
        htmlContent,
        textContent
      });

      const successResponse = {
        message: 'If an account exists with this email, a password reset link will be sent.',
        success: true
      };

      if (process.env.NODE_ENV !== 'production') {
        successResponse.debugResetUrl = resetUrl;
      }

      return res.json(successResponse);
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError?.response?.data || emailError.message || emailError);
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Development mode - Reset URL (for debugging only):', resetUrl);
      }

      // Prevent keeping an unusable reset token when email delivery fails.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        message: 'Unable to send reset email right now. Please try again in a few minutes.',
        success: false,
        ...(process.env.NODE_ENV !== 'production' && { debugResetUrl: resetUrl })
      });
    }
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify reset token
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one letter and one number' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      message: 'Password has been reset successfully',
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set password for OAuth users who don't have one
export const setPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const userId = req.user._id || req.user.id; // From auth middleware

    // Validate password
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one letter and one number' });
    }

    // Find user
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a password
    if (user.password) {
      return res.status(400).json({
        message: 'Password already exists. Use change password instead.'
      });
    }

    // Hash and set password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: 'Password set successfully. You can now login with email and password.',
      success: true
    });
  } catch (error) {
    // console.error('Set password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change existing password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'Current password, new password, and confirm password are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one letter and one number' });
    }

    // Find user
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a password
    if (!user.password) {
      return res.status(400).json({
        message: 'No password set. Use set password instead.'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully',
      success: true
    });
  } catch (error) {
    // console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user has a password set
export const checkPasswordStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('password googleId facebookId');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      hasPassword: !!user.password,
      isOAuthUser: !!(user.googleId || user.facebookId),
      canSetPassword: !user.password && !!(user.googleId || user.facebookId)
    });
  } catch (error) {
    // console.error('Check password status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
