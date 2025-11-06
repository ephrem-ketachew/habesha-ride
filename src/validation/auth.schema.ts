import { z } from 'zod';
import { sanitizeInput } from '../utils/sanitize.util.js';

const capitalize = (val: string) =>
  val
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

export const registerUserSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name cannot exceed 50 characters')
      .transform(sanitizeInput)
      .transform(capitalize),
    lastName: z
      .string()
      .trim()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name cannot exceed 50 characters')
      .transform(sanitizeInput)
      .transform(capitalize),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Please provide a valid email address')
      .toLowerCase(),
    phoneNumber: z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      .regex(/^[0-9]{7,15}$/, 'Phone number must contain 7-15 digits'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'Password must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      ),
    passwordConfirm: z.string().min(1, 'Password confirmation is required'),
  })
  .strict()
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const loginUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'Password must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      ),
    passwordConfirm: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  });

export const resetPasswordTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'Password must contain 1 uppercase, 1 lowercase, 1 number, and 1 special character',
      ),
    passwordConfirm: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  })
  .refine((data) => data.currentPassword !== data.password, {
    message: 'New password must be different from the current one',
    path: ['password'],
  });

export const googleAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export type ResetPasswordTokenInput = z.infer<typeof resetPasswordTokenSchema>;

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export type LoginUserInput = z.infer<typeof loginUserSchema>;

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
