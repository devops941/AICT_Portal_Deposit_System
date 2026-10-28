import { Router } from 'express';
import { rbacController } from './rbac.controller';
import { authenticateToken, authorizePermissions } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { createRoleSchema, updateRoleSchema } from './rbac.validation';

export const rolesRouter = Router();
export const permissionsRouter = Router();

// Roles routes
rolesRouter.use(authenticateToken);
rolesRouter.get('/', authorizePermissions('ROLES:READ'), rbacController.getRoles);
rolesRouter.post(
  '/',
  authorizePermissions('ROLES:CREATE'),
  validateRequest(createRoleSchema),
  rbacController.createRole
);
rolesRouter.patch(
  '/:id',
  authorizePermissions('ROLES:UPDATE'),
  validateRequest(updateRoleSchema),
  rbacController.updateRole
);

// Permissions routes
permissionsRouter.use(authenticateToken);
permissionsRouter.get('/', authorizePermissions('ROLES:READ'), rbacController.getPermissions);
