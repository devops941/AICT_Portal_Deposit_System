import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/appError';
import { Admin } from '../models/Admin.model';
import { User } from '../models/User.model';
import { IRole } from '../models/Role.model';
import { IPermission } from '../models/Permission.model';

export interface TokenPayload {
  userId: string;
  email: string;
  userType: 'ADMIN' | 'USER';
}

export interface AuthUserContext {
  id: string;
  email: string;
  fullName: string;
  userType: 'ADMIN' | 'USER';
  roles: string[];
  permissions: string[];
  institutionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(AppError.unauthorized('Authentication token is required'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

    if (decoded.userType === 'ADMIN') {
      const admin = await Admin.findById(decoded.userId);
      if (!admin) {
        return next(AppError.unauthorized('Administrator account not found'));
      }
      if (!admin.isActive) {
        return next(AppError.forbidden('Administrator account is deactivated'));
      }
      if (admin.isLocked()) {
        return next(AppError.forbidden('Administrator account is temporarily locked due to failed attempts'));
      }

      req.user = {
        id: admin._id.toString(),
        email: admin.email,
        fullName: admin.fullName,
        userType: 'ADMIN',
        roles: ['SYSTEM_ADMINISTRATOR'],
        permissions: ['*'], // SuperAdmin has all permissions
        institutionId: undefined,
      };
      return next();
    }

    // Normal User verification
    const user = await User.findById(decoded.userId).populate<{
      roles: Array<IRole & { permissions: IPermission[] }>;
    }>({
      path: 'roles',
      populate: {
        path: 'permissions',
      },
    });

    if (!user) {
      return next(AppError.unauthorized('User account not found'));
    }
    if (user.status !== 'ACTIVE') {
      return next(AppError.forbidden(`Your account is currently ${user.status.toLowerCase()}`));
    }
    if (user.isLocked()) {
      return next(AppError.forbidden('User account is temporarily locked due to multiple failed login attempts'));
    }

    // Flatten role names and permission codes
    const roleNames: string[] = [];
    const permissionCodes = new Set<string>();

    for (const role of user.roles) {
      if (typeof role === 'object' && role.name) {
        roleNames.push(role.name);
        if (Array.isArray(role.permissions)) {
          for (const perm of role.permissions) {
            if (typeof perm === 'object' && perm.code) {
              permissionCodes.add(perm.code);
            }
          }
        }
      }
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      userType: 'USER',
      roles: roleNames,
      permissions: Array.from(permissionCodes),
      institutionId: user.institutionId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user has one of the allowed roles
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    // SuperAdmin bypasses role check
    if (req.user.userType === 'ADMIN' || req.user.roles.includes('SYSTEM_ADMINISTRATOR')) {
      return next();
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(AppError.forbidden(`Access restricted to roles: [${allowedRoles.join(', ')}]`));
    }

    next();
  };
};

// Check if user has all required permissions
export const authorizePermissions = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    // SuperAdmin has '*' permission
    if (req.user.permissions.includes('*')) {
      return next();
    }

    const hasAllPermissions = requiredPermissions.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasAllPermissions) {
      return next(
        AppError.forbidden(`Missing required permission: [${requiredPermissions.join(', ')}]`)
      );
    }

    next();
  };
};

// Institution-level data isolation middleware
export const checkInstitutionAccess = (targetInstitutionId?: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    // Super Admin / Central Officers have cross-institution visibility
    if (req.user.userType === 'ADMIN' || req.user.roles.includes('SYSTEM_ADMINISTRATOR')) {
      return next();
    }

    const requestedInstId = targetInstitutionId || req.params.institutionId || req.body.institutionId;

    if (requestedInstId && req.user.institutionId && req.user.institutionId !== requestedInstId) {
      return next(
        AppError.forbidden('Institution data isolation policy violation: Cross-tenant access denied')
      );
    }

    next();
  };
};
