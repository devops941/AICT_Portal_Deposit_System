import { Router } from 'express';
import { userController } from './user.controller';
import { authenticateToken, authorizePermissions } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import {
  userListQuerySchema,
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from './user.validation';

const router = Router();

// All user management routes require authentication
router.use(authenticateToken);

router.get(
  '/',
  authorizePermissions('USERS:READ'),
  validateRequest(userListQuerySchema),
  userController.getUsers
);

router.post(
  '/',
  authorizePermissions('USERS:CREATE'),
  validateRequest(createUserSchema),
  userController.createUser
);

router.get(
  '/:id',
  authorizePermissions('USERS:READ'),
  validateRequest(userIdParamSchema),
  userController.getUserById
);

router.patch(
  '/:id',
  authorizePermissions('USERS:UPDATE'),
  validateRequest(updateUserSchema),
  userController.updateUser
);

router.patch(
  '/:id/status',
  authorizePermissions('USERS:UPDATE'),
  validateRequest(updateUserStatusSchema),
  userController.updateUserStatus
);

export default router;
