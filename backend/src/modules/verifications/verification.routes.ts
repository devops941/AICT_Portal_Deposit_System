import { Router } from 'express';
import { verificationController } from './verification.controller';
import { authenticateToken, authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  verifyFdrSchema,
  rejectVerificationSchema,
  requestClarificationSchema,
} from './verification.validation';

const router = Router();

router.use(authenticateToken);
// Restrict all verification desk endpoints to AICTE Officers & Admins
router.use(
  authorizeRoles(
    'SYSTEM_ADMINISTRATOR',
    'VERIFICATION_OFFICER',
    'SENIOR_VERIFICATION_OFFICER',
    'APPROVING_AUTHORITY'
  )
);

// Pending verifications queue
router.get('/pending', verificationController.pending);

// Verification packet & action routes
router.get('/:id', verificationController.getPacket);
router.post('/:id/verify', validate(verifyFdrSchema), verificationController.verify);
router.post('/:id/reject', validate(rejectVerificationSchema), verificationController.reject);
router.post('/:id/clarification', validate(requestClarificationSchema), verificationController.requestClarification);
router.get('/:id/history', verificationController.history);

export default router;
