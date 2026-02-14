import type { ValidationChain } from 'express-validator';

import { check } from 'express-validator';

export const userValidationRules: { [key: string]: ValidationChain[] } = {
  register: [
    check('username')
      .trim()
      .escape()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters long')
      .isAlphanumeric()
      .withMessage('Username must contain only letters and numbers'),

    check('email')
      .trim()
      .normalizeEmail()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format'),

    check('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .bail()
      .custom((value) => {
        const forbidden = ['<', '>', '"', '/', '\\'];
        const found = forbidden.find((char) => value.includes(char));
        if (found) {
          throw new Error(`Password cannot contain '${found}'`);
        }
        return true;
      })
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ],
  login: [
    check('email')
      .trim()
      .normalizeEmail()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format'),

    check('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .bail()
      .custom((value) => {
        const forbidden = ['<', '>', '"', '/', '\\'];
        const found = forbidden.find((char) => value.includes(char));
        if (found) {
          throw new Error(`Password cannot contain '${found}'`);
        }
        return true;
      }),
  ],
};

// export const registerValidationRules = [
//   body('email').isEmail().withMessage('Ungültige E-Mail-Adresse'),
//   body('password').isLength({ min: 6 }).withMessage('Passwort muss mindestens 6 Zeichen lang sein'),
// ];
