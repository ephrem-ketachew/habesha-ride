import User from '../models/user.model.js';
import AppError from '../utils/appError.util.js';
import { sendEmail } from '../utils/email.util.js';
import { RegisterUserInput } from '../validation/auth.schema.js';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';
import crypto from 'crypto';

export const registerUser = async (input: RegisterUserInput) => {
  const existingUser = await User.findOne({
    $or: [{ email: input.email }, { phoneNumber: input.phoneNumber }],
  });

  if (existingUser) {
    throw new AppError(
      'An account with this email or phone number already exists.',
      409,
    );
  }

  const user = new User(input);

  const verificationToken = user.createEmailVerificationToken();

  await user.save();

  try {
    const verificationURL = `${config.clientUrl}/verify-email?token=${verificationToken}`;

    const message = `Welcome to Kech.ai! Please verify your email by clicking this link: ${verificationURL}\n\nThis link is valid for 24 hours.`;

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email for Kech.ai',
      text: message,
      html: `<p>Welcome to Kech.ai! Please verify your email by clicking the link below:</p>
             <a href="${verificationURL}" target="_blank">Verify Your Email</a>
             <p>This link is valid for 24 hours.</p>`,
    });
  } catch (emailError) {
    logger.error(
      emailError,
      `Failed to send verification email to ${user.email}`,
    );
  }

  return user;
};

export const verifyEmail = async (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Token is invalid or has expired.', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;

  await user.save();
};
