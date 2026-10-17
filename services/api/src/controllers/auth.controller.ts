import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginSchema } from '@remotedesk/shared';
import { UserRepository } from '../repositories/user.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { env } from '../config/env.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.parse(req.body);
    const userWithPassword = UserRepository.findByEmail(parsed.email);

    if (!userWithPassword) {
      AuditRepository.record({
        action: 'USER_LOGIN_FAILED',
        details: { email: parsed.email, reason: 'User not found' },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        requestId: req.requestId,
      });
      return;
    }

    const isMatch = bcrypt.compareSync(parsed.password, userWithPassword.passwordHash);
    if (!isMatch) {
      AuditRepository.record({
        userId: userWithPassword.id,
        action: 'USER_LOGIN_FAILED',
        details: { email: parsed.email, reason: 'Incorrect password' },
        ipAddress: req.ip,
        status: 'FAILURE',
      });

      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        requestId: req.requestId,
      });
      return;
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      { userId: userWithPassword.id, email: userWithPassword.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    UserRepository.createSession(userWithPassword.id, token, expiresAt);

    // Set secure HttpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    AuditRepository.record({
      userId: userWithPassword.id,
      action: 'USER_LOGIN_SUCCESS',
      ipAddress: req.ip,
      status: 'SUCCESS',
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userWithPassword.id,
          email: userWithPassword.email,
          name: userWithPassword.name,
          createdAt: userWithPassword.createdAt,
          updatedAt: userWithPassword.updatedAt,
        },
      },
      requestId: req.requestId,
    });
  }

  static async logout(req: Request, res: Response): Promise<void> {
    if (req.token) {
      UserRepository.deleteSession(req.token);
    }

    res.clearCookie('auth_token');

    if (req.user) {
      AuditRepository.record({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        ipAddress: req.ip,
        status: 'SUCCESS',
      });
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      requestId: req.requestId,
    });
  }

  static async session(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: { user: req.user },
      requestId: req.requestId,
    });
  }
}
