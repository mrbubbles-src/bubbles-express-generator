export interface GlobalError extends Error {
  statusCode?: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}
export type JWTPayload = Pick<User, 'id' | 'username' | 'role' | 'verified'> & {
  iat?: number;
  exp?: number;
};
