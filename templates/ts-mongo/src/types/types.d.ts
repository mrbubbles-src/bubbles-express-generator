import { Types } from 'mongoose';

export interface GlobalError extends Error {
  statusCode?: number;
}

interface User {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}
export type JWTPayload = Pick<User, '_id' | 'username' | 'role' | 'verified'> & {
  iat?: number;
  exp?: number;
};
