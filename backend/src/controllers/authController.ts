import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, refreshTokens, logoutUser } from '../services/authService';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { audit } from '../services/auditService';
import { config } from '../config';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ success: false, message: 'email, password and name are required' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const user = await registerUser({ email, password, name });
    await audit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      action: 'user.registered',
      resource: 'User',
      resourceId: user._id.toString(),
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'email and password are required' });
      return;
    }

    const { user, tokens } = await loginUser(email, password);

    res.cookie('token', tokens.accessToken, COOKIE_OPTS);
    res.cookie('refreshToken', tokens.refreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    await audit({
      actorId: user._id.toString(),
      actorEmail: user.email,
      action: 'user.login',
      resource: 'User',
      resourceId: user._id.toString(),
      ip: req.ip,
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const tokens = await refreshTokens(refreshToken);
    res.cookie('token', tokens.accessToken, COOKIE_OPTS);
    res.cookie('refreshToken', tokens.refreshToken, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({ success: true, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user) {
      await logoutUser(req.user.id);
    }
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('-passwordHash -refreshToken -resetToken');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { ...(name && { name }), ...(bio !== undefined && { bio }) },
      { new: true }
    ).select('-passwordHash -refreshToken');

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
