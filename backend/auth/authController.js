import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { verifyFirebaseToken, getFirebaseUserByPhone } from '../services/smsService.js';
import { sendVerificationEmail } from '../controllers/emailVerificationController.js';
import redis from '../config/redis.js';
import { logger } from '../utils/logger.js';

// Helper functions for Redis-based pending registrations
export const storePendingRegistration = async (email, data) => {
  const key = `pending:registration:${email}`;
  logger.debug('[REDIS] Storing pending registration', {
    email,
    key,
    expiresAt: new Date(data.expiresAt).toISOString()
  });
  await redis.setex(key, 600, JSON.stringify(data)); // 10 minutes TTL
  logger.debug('[REDIS] Pending registration stored successfully', { email });
};

export const getPendingRegistration = async (email) => {
  const key = `pending:registration:${email}`;
  logger.debug('[REDIS] Retrieving pending registration', { email, key });
  const data = await redis.get(key);
  const result = data ? JSON.parse(data) : null;
  logger.debug('[REDIS] Retrieved pending registration', { 
    email, 
    found: !!result 
  });
  return result;
};

export const deletePendingRegistration = async (email) => {
  const key = `pending:registration:${email}`;
  logger.debug('[REDIS] Deleting pending registration', { email, key });
  await redis.del(key);
  logger.debug('[REDIS] Pending registration deleted', { email });
};

// Fallback: In-memory store if Redis is unavailable
export const pendingRegistrations = new Map();

// Clean up expired in-memory registrations every minute (fallback only)
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingRegistrations.entries()) {
    if (data.expiresAt < now) {
      pendingRegistrations.delete(email);
      // console.log(`[CLEANUP] Removed expired registration for: ${email}`);
    }
  }
}, 60000);

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  logger.info('[REGISTER] Registration request received', {
    email,
    name,
    timestamp: new Date().toISOString()
  });

  try {
    // Validate required fields
    if (!name || !email || !password) {
      logger.warn('[REGISTER] Missing required fields', {
        hasName: !!name,
        hasEmail: !!email,
        hasPassword: !!password
      });
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    logger.debug('[REGISTER] Validating password', {
      email,
      passwordLength: password?.length,
      hasLetterAndNumber: /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)
    });

    if (password.length < 8) {
      logger.warn('[REGISTER] Password too short', { email });
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      logger.warn('[REGISTER] Password missing letter or number', { email });
      return res.status(400).json({ message: "Password must contain at least one letter and one number" });
    }

    logger.debug('[REGISTER] Checking for existing user', { email });

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn('[REGISTER] User already exists', {
        email,
        existingUserId: existing._id
      });
      return res.status(400).json({ message: "User already exists with this email" });
    }

    logger.debug('[REGISTER] Generating OTP and hashing password', { email });

    // Generate verification OTP (6-digit, 10-minute expiry)
    const verificationOTP = crypto.randomInt(100000, 1000000).toString();
    const hashedOTP = crypto.createHash('sha256').update(verificationOTP).digest('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    logger.debug('[REGISTER] OTP and password generated', {
      email,
      otpHash: hashedOTP.substring(0, 10) + '***',
      passwordHashed: !!hashedPassword
    });

    // Store registration data temporarily in Redis (or fallback to in-memory)
    const registrationData = {
      name,
      email,
      password: hashedPassword,
      otp: hashedOTP,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes for production
    };

    logger.info('[REGISTER] Storing pending registration', {
      email,
      expiresAt: new Date(registrationData.expiresAt).toISOString()
    });

    try {
      // Try Redis first
      await storePendingRegistration(email, registrationData);
      logger.debug('[REGISTER] Stored in Redis', { email });
    } catch (redisError) {
      // Fallback to in-memory if Redis fails
      logger.warn('[REGISTER] Redis failed, using in-memory fallback', {
        email,
        error: redisError.message
      });
      pendingRegistrations.set(email, registrationData);
    }

    logger.info('[REGISTER] Pending registration created', {
      email,
      expiresIn: '10 minutes'
    });

    try {
      // Send verification email
      logger.info('[REGISTER] Attempting to send verification email', { email });
      await sendVerificationEmail({ name, email }, verificationOTP);

      logger.info('[REGISTER] ✅ Verification email sent successfully', {
        email,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        message: "Verification code sent! Please check your email and enter the code within 10 minutes.",
        emailSent: true,
        expiresIn: "10 minutes"
      });
    } catch (emailError) {
      logger.error('[REGISTER] ❌ Failed to send verification email', {
        email,
        error: emailError.message,
        errorCode: emailError.code,
        stack: emailError.stack,
        timestamp: new Date().toISOString()
      });

      // Remove pending registration if email fails
      try {
        await deletePendingRegistration(email);
      } catch {
        pendingRegistrations.delete(email);
      }

      return res.status(500).json({
        message: 'Failed to send verification email. Please check your email address.',
        emailSent: false,
        error: emailError.message
      });
    }
  } catch (err) {
    logger.error('[REGISTER] ❌ Unexpected registration error', {
      email: req.body?.email,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  logger.info('[LOGIN] Login attempt', {
    email,
    timestamp: new Date().toISOString()
  });

  try {
    logger.debug('[LOGIN] Fetching user from database', { email });

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      logger.warn('[LOGIN] User not found', { email });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    logger.debug('[LOGIN] User found, checking email verification status', {
      email,
      isEmailVerified: user.isEmailVerified
    });

    // Check if email is verified
    if (!user.isEmailVerified) {
      logger.warn('[LOGIN] User attempted login without email verification', {
        email,
        userId: user._id
      });
      return res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
        emailNotVerified: true
      });
    }

    logger.debug('[LOGIN] Verifying password', { email });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('[LOGIN] Incorrect password', { email });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    logger.debug('[LOGIN] Password verified, generating JWT', { email });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage
    };

    logger.info('[LOGIN] ✅ Login successful', {
      email,
      userId: user._id,
      timestamp: new Date().toISOString()
    });

    res.json({
      token,
      user: userResponse
    });
  } catch (err) {
    logger.error('[LOGIN] ❌ Login error', {
      email: req.body?.email,
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: err.message });
  }
};

// Validate JWT token
export const validateToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        message: 'No token provided or invalid format'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user details
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        valid: false,
        message: 'User not found'
      });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage
      }
    });
  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        valid: false,
        message: 'Token expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        valid: false,
        message: 'Invalid token'
      });
    } else {
      return res.status(500).json({
        valid: false,
        message: 'Server error'
      });
    }
  }
};

// Get current user profile (protected route)
export const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by middleware
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify Firebase ID token and login/register user
export const verifyFirebaseOTP = async (req, res) => {
  try {
    const { idToken, name } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID token is required' });
    }

    // Verify Firebase token
    const tokenResult = await verifyFirebaseToken(idToken);

    if (!tokenResult.success) {
      return res.status(400).json({ message: tokenResult.error });
    }

    const firebaseUser = tokenResult.user;

    if (!firebaseUser.phoneNumber) {
      return res.status(400).json({ message: 'Phone number not found in Firebase token' });
    }

    // Check if user exists with this phone number
    let user = await User.findOne({ phone: firebaseUser.phoneNumber });

    if (!user) {
      // Create new user if doesn't exist
      const userName = name || firebaseUser.name || `User_${Date.now()}`;

      user = new User({
        name: userName,
        phone: firebaseUser.phoneNumber,
        email: firebaseUser.email || null,
        isPhoneVerified: true,
        firebaseUid: firebaseUser.uid
      });

      await user.save();
      // console.log('✅ New user created:', user.phone);
    } else {
      // Update phone verification status and Firebase UID
      user.isPhoneVerified = true;
      user.firebaseUid = firebaseUser.uid;
      if (firebaseUser.email && !user.email) {
        user.email = firebaseUser.email;
      }
      await user.save();
      // console.log('✅ Existing user updated:', user.phone);
    }

    // Generate JWT token for our application
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        profileImage: user.profileImage,
        isPhoneVerified: user.isPhoneVerified
      },
      message: 'Login successful'
    });
  } catch (error) {
    // console.error('Firebase OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
