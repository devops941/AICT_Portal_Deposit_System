import bcrypt from 'bcryptjs';
import { Admin } from '../models/Admin.model';
import { Permission, PermissionAction } from '../models/Permission.model';
import { Role } from '../models/Role.model';
import { logger } from './logger';

export async function seedInitialData(): Promise<void> {
  try {
    // 1. Seed Permissions across all system domains
    const resources = ['USERS', 'ROLES', 'INSTITUTIONS', 'DEPOSITS', 'FDR', 'REPORTS', 'AUDIT'] as const;
    const actions: PermissionAction[] = [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'SUBMIT',
      'VERIFY',
      'APPROVE',
      'REJECT',
      'EXPORT',
    ];

    const permissionDefs: Array<{
      code: string;
      resource: string;
      action: PermissionAction;
      description: string;
    }> = [];

    for (const res of resources) {
      for (const act of actions) {
        permissionDefs.push({
          code: `${res}:${act}`,
          resource: res,
          action: act,
          description: `Permission to ${act.toLowerCase()} on ${res.toLowerCase()}`,
        });
      }
    }

    const createdPermissions = [];
    for (const p of permissionDefs) {
      let existing = await Permission.findOne({ code: p.code });
      if (!existing) {
        existing = await Permission.create(p);
      }
      createdPermissions.push(existing);
    }
    logger.info(`Permissions verified: ${createdPermissions.length}`);

    // Map permissions by code for fast lookup
    const permMap = new Map(createdPermissions.map((p) => [p.code, p._id]));

    // 2. Seed Default System Roles
    const roleDefinitions = [
      {
        name: 'SYSTEM_ADMINISTRATOR',
        displayName: 'System Administrator',
        description: 'Complete system access across all institutions, officers, and portals.',
        isSystemRole: true,
        permissions: createdPermissions.map((p) => p._id),
      },
      {
        name: 'INSTITUTION_ADMIN',
        displayName: 'Institution Admin',
        description: 'Administrator for an accredited institution. Manages institution staff and deposits.',
        isSystemRole: true,
        permissions: [
          permMap.get('USERS:CREATE'),
          permMap.get('USERS:READ'),
          permMap.get('USERS:UPDATE'),
          permMap.get('INSTITUTIONS:READ'),
          permMap.get('INSTITUTIONS:UPDATE'),
          permMap.get('DEPOSITS:CREATE'),
          permMap.get('DEPOSITS:READ'),
          permMap.get('DEPOSITS:SUBMIT'),
          permMap.get('FDR:CREATE'),
          permMap.get('FDR:READ'),
          permMap.get('FDR:SUBMIT'),
          permMap.get('REPORTS:READ'),
          permMap.get('REPORTS:EXPORT'),
        ].filter(Boolean),
      },
      {
        name: 'INSTITUTION_STAFF',
        displayName: 'Institution Staff',
        description: 'Staff member who uploads FDRs and tracks deposit submission status.',
        isSystemRole: true,
        permissions: [
          permMap.get('INSTITUTIONS:READ'),
          permMap.get('DEPOSITS:READ'),
          permMap.get('DEPOSITS:SUBMIT'),
          permMap.get('FDR:READ'),
          permMap.get('FDR:SUBMIT'),
        ].filter(Boolean),
      },
      {
        name: 'VERIFICATION_OFFICER',
        displayName: 'Verification Officer',
        description: 'AICTE officer responsible for initial verification of FDR bank guarantees.',
        isSystemRole: true,
        permissions: [
          permMap.get('INSTITUTIONS:READ'),
          permMap.get('INSTITUTIONS:VERIFY'),
          permMap.get('DEPOSITS:READ'),
          permMap.get('DEPOSITS:VERIFY'),
          permMap.get('FDR:READ'),
          permMap.get('FDR:VERIFY'),
          permMap.get('REPORTS:READ'),
        ].filter(Boolean),
      },
      {
        name: 'SENIOR_VERIFICATION_OFFICER',
        displayName: 'Senior Verification Officer',
        description: 'Senior officer conducting secondary checks, endorsements, and rejections.',
        isSystemRole: true,
        permissions: [
          permMap.get('INSTITUTIONS:READ'),
          permMap.get('INSTITUTIONS:VERIFY'),
          permMap.get('INSTITUTIONS:APPROVE'),
          permMap.get('DEPOSITS:READ'),
          permMap.get('DEPOSITS:VERIFY'),
          permMap.get('DEPOSITS:REJECT'),
          permMap.get('FDR:READ'),
          permMap.get('FDR:VERIFY'),
          permMap.get('FDR:REJECT'),
          permMap.get('REPORTS:READ'),
          permMap.get('REPORTS:EXPORT'),
        ].filter(Boolean),
      },
      {
        name: 'APPROVING_AUTHORITY',
        displayName: 'Approving Authority',
        description: 'High-level AICTE authority granting final encashment or deposit release approvals.',
        isSystemRole: true,
        permissions: [
          permMap.get('INSTITUTIONS:READ'),
          permMap.get('INSTITUTIONS:APPROVE'),
          permMap.get('INSTITUTIONS:REJECT'),
          permMap.get('DEPOSITS:READ'),
          permMap.get('DEPOSITS:APPROVE'),
          permMap.get('DEPOSITS:REJECT'),
          permMap.get('FDR:READ'),
          permMap.get('FDR:APPROVE'),
          permMap.get('FDR:REJECT'),
          permMap.get('REPORTS:READ'),
          permMap.get('REPORTS:EXPORT'),
        ].filter(Boolean),
      },
      {
        name: 'AUDITOR',
        displayName: 'Auditor',
        description: 'Audit inspector with read-only compliance, audit log, and reporting access.',
        isSystemRole: true,
        permissions: [
          permMap.get('INSTITUTIONS:READ'),
          permMap.get('INSTITUTIONS:EXPORT'),
          permMap.get('DEPOSITS:READ'),
          permMap.get('FDR:READ'),
          permMap.get('REPORTS:READ'),
          permMap.get('REPORTS:EXPORT'),
          permMap.get('AUDIT:READ'),
          permMap.get('AUDIT:EXPORT'),
        ].filter(Boolean),
      },
    ];

    for (const r of roleDefinitions) {
      const existingRole = await Role.findOne({ name: r.name });
      if (!existingRole) {
        await Role.create(r);
        logger.info(`Seeded role: [${r.name}]`);
      } else {
        existingRole.permissions = r.permissions as any;
        await existingRole.save();
      }
    }

    // 3. Seed Super Admin in the separate 'admins' collection
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin@123', 12);
      await Admin.create({
        fullName: 'System Super Administrator',
        email: adminEmail,
        phone: '+91-9876543210',
        passwordHash,
        role: 'SYSTEM_ADMINISTRATOR',
        isActive: true,
        failedLoginAttempts: 0,
      });
      logger.info(`Default Super Admin created: ${adminEmail} (Collection: admins)`);
    } else {
      logger.info(`Super Admin verified: ${adminEmail}`);
    }
  } catch (error) {
    logger.error('Error during database initialization:', error);
  }
}
