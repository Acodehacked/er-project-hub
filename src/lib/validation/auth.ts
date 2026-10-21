import { z } from 'zod';
import { idSchema } from './common';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  password: z.string().min(1, 'Enter your password').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Words that cannot be usernames because they collide with routes or look official. */
export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'api', 'app', 'auth', 'dashboard', 'erhub', 'faculty', 'help', 'login',
  'logout', 'me', 'new', 'notifications', 'profile', 'projects', 'register', 'representative',
  'root', 'settings', 'signin', 'signup', 'staff', 'student', 'support', 'system', 'technologies',
  'u', 'user', 'users',
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'At least 3 characters')
  .max(30, 'At most 30 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens')
  .refine((v) => !RESERVED_USERNAMES.has(v), 'This username is reserved');

export const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128, 'At most 128 characters')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/[0-9]/, 'Include at least one number');

const currentYear = new Date().getFullYear();

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(120),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    departmentId: idSchema,
    studentIdentifier: z
      .string()
      .trim()
      .min(3, 'Enter your register / roll number')
      .max(50)
      .regex(/^[A-Za-z0-9/-]+$/, 'Letters, numbers, "/" and "-" only'),
    graduationYear: z.coerce
      .number<string | number>()
      .int()
      .min(currentYear - 10, 'Check the year')
      .max(currentYear + 6, 'Check the year'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type RegisterInput = z.input<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
