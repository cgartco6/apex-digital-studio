const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../services/email.service');
const asyncHandler = require('express-async-handler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register User
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, company, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    company,
    role: role || 'client'
  });

  // Generate verification token
  const verificationToken = user.createVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your email - Apex Digital Studio',
      template: 'verify-email',
      data: {
        name: user.firstName,
        verificationUrl
      }
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

// Login User
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check user
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  user.loginHistory.push({
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
      company: user.company,
      subscription: user.subscription,
      preferences: user.preferences
    }
  });
});

// Get Current User
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    user
  });
});

// Forgot Password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No user found with this email'
    });
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request - Apex Digital Studio',
      template: 'reset-password',
      data: {
        name: user.firstName,
        resetUrl,
        expiresIn: '10 minutes'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

// Reset Password
exports.resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    message: 'Password reset successful'
  });
});

// Update User Profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, company, preferences } = req.body;

  const user = await User.findById(req.user.id);

  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (company) user.company = company;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  res.status(200).json({
    success: true,
    user
  });
});

// Update Password
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    message: 'Password updated successfully'
  });
});

// Verify Email
exports.verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired'
    });
  }

  // Verify user
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  
  // Add free credits for verification
  user.aiCredits.free += 20;
  
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    message: 'Email verified successfully'
  });
});

// Resend Verification Email
exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  const verificationToken = user.createVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your email - Apex Digital Studio',
      template: 'verify-email',
      data: {
        name: user.firstName,
        verificationUrl
      }
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});
