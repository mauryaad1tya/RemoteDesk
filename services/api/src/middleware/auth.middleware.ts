import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UserRepository } from '../repositories/user.repository.js';
import { User } from '@remotedesk/shared';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check HttpOnly cookie if header not present
  if (!token && req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. No session token provided.',
      },
      requestId: req.requestId,
    });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; sessionId?: string };
    
    // Verify session existence in database to support server-side revocation
    const session = UserRepository.findSessionByToken(token);
    if (!session || new Date(session.expiresAt) < new Date()) {
      res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired or was revoked. Please log in again.',
        },
        requestId: req.requestId,
      });
      return;
    }

    const user = UserRepository.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Authenticated user no longer exists.',
        },
        requestId: req.requestId,
      });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token.',
      },
      requestId: req.requestId,
    });
  }
}
