import { Router } from 'express';
import { approvalController } from './approval.controller';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createApprovalSchema,
  approveStepSchema,
  rejectStepSchema,
  returnStepSchema,
  escalateStepSchema,
} from './approval.validation';

const router = Router();

router.use(authenticateToken);
// Restrict all approval center actions to authorized workflow roles
router.use(
  authorizeRoles(
    'SYSTEM_ADMINISTRATOR',
    'APPROVING_AUTHORITY',
    'SENIOR_VERIFICATION_OFFICER',
    'VERIFICATION_OFFICER'
  )
);

// List approvals & create approval
router.get('/', approvalController.list);
router.post('/', validate(createApprovalSchema), approvalController.create);
router.get('/:id', approvalController.getById);

// Workflow Step actions
router.post('/:id/approve', validate(approveStepSchema), approvalController.approve);
router.post('/:id/reject', validate(rejectStepSchema), approvalController.reject);
router.post('/:id/return', validate(returnStepSchema), approvalController.returnStep);
router.post('/:id/escalate', validate(escalateStepSchema), approvalController.escalate);

export default router;
