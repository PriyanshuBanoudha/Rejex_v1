import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { config } from '../config';
import { User, IUser, UserRole } from '../models/User';
import { AuditLog } from '../models/AuditLog';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(user: { _id: string; email: string; role: UserRole; name: string }): TokenPair {
  const payload = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };

  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });

  const refreshToken = jwt.sign(
    { id: user._id.toString(), type: 'refresh' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN as any }
  );

  return { accessToken, refreshToken };
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}): Promise<IUser> {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    const err: any = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await argon2.hash(data.password);
  const user = await User.create({
    email: data.email.toLowerCase(),
    passwordHash,
    name: data.name,
    role: data.role || 'participant',
  });

  return user;
}

export async function loginUser(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    const err: any = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const tokens = generateTokens({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  // Store refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return { user, tokens };
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch {
    const err: any = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  if (decoded.type !== 'refresh') {
    const err: any = new Error('Invalid token type');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    const err: any = new Error('Refresh token revoked or invalid');
    err.statusCode = 401;
    throw err;
  }

  const tokens = generateTokens({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return tokens;
}

export async function logoutUser(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
}
