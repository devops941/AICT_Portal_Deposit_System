"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPortalUsers = seedPortalUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const User_model_1 = require("../models/User.model");
const Role_model_1 = require("../models/Role.model");
async function seedPortalUsers() {
    console.log('\n============================================================');
    console.log('👥 SEEDING PORTAL USERS ACROSS ROLES & INSTITUTIONS');
    console.log('============================================================\n');
    try {
        await (0, database_1.connectDatabase)();
        const roles = await Role_model_1.Role.find({}).lean();
        const roleMap = new Map(roles.map((r) => [r.name, r._id]));
        const reqRoles = [
            'SYSTEM_ADMINISTRATOR',
            'VERIFICATION_OFFICER',
            'SENIOR_VERIFICATION_OFFICER',
            'APPROVING_AUTHORITY',
            'AUDITOR',
            'INSTITUTION_ADMIN',
            'INSTITUTION_STAFF',
        ];
        for (const rName of reqRoles) {
            if (!roleMap.has(rName)) {
                console.error(`❌ Required role [${rName}] not found in database!`);
                process.exit(1);
            }
        }
        const defaultPasswordHash = await bcryptjs_1.default.hash('Admin@123', 10);
        const userDefinitions = [
            {
                fullName: 'Gokul (Lead Administrator)',
                email: 'gokul@gmail.com',
                phone: '+91 73391 14983',
                roleNames: ['SYSTEM_ADMINISTRATOR'],
                institutionId: undefined,
                status: 'ACTIVE',
            },
            {
                fullName: 'Dr. Ananya Sharma',
                email: 'ananya.sharma@aicte-india.org',
                phone: '+91 98401 23452',
                roleNames: ['SENIOR_VERIFICATION_OFFICER'],
                institutionId: undefined,
                status: 'ACTIVE',
            },
            {
                fullName: 'Ramesh Kumar',
                email: 'ramesh.kumar@aicte-india.org',
                phone: '+91 98401 23451',
                roleNames: ['VERIFICATION_OFFICER'],
                institutionId: undefined,
                status: 'ACTIVE',
            },
            {
                fullName: 'Prof. M. K. Sridhar (Regional Director)',
                email: 'director.approvals@aicte-india.org',
                phone: '+91 98401 23453',
                roleNames: ['APPROVING_AUTHORITY'],
                institutionId: undefined,
                status: 'ACTIVE',
            },
            {
                fullName: 'S. Venkataraman (FCA / Lead Auditor)',
                email: 'audit.officer@aicte-india.org',
                phone: '+91 98401 23454',
                roleNames: ['AUDITOR'],
                institutionId: undefined,
                status: 'ACTIVE',
            },
            {
                fullName: 'Dr. P. Hariharan (Dean CEG)',
                email: 'dean.ceg@annauniv.edu',
                phone: '+91 94440 12001',
                roleNames: ['INSTITUTION_ADMIN'],
                institutionId: 'INST-CEG-001',
                status: 'ACTIVE',
            },
            {
                fullName: 'K. Meenakshi (Finance Section)',
                email: 'finance.ceg@annauniv.edu',
                phone: '+91 98411 77101',
                roleNames: ['INSTITUTION_STAFF'],
                institutionId: 'INST-CEG-001',
                status: 'ACTIVE',
            },
            {
                fullName: 'Dr. K. Prakasan (Principal PSG)',
                email: 'principal@psgtech.edu',
                phone: '+91 94440 12002',
                roleNames: ['INSTITUTION_ADMIN'],
                institutionId: 'INST-PSG-002',
                status: 'ACTIVE',
            },
            {
                fullName: 'R. Saravanan (Accounts Officer)',
                email: 'accounts.psg@psgtech.edu',
                phone: '+91 98411 77102',
                roleNames: ['INSTITUTION_STAFF'],
                institutionId: 'INST-PSG-002',
                status: 'ACTIVE',
            },
            {
                fullName: 'Dr. V. Samuel Raj (Registrar VIT)',
                email: 'registrar@vit.ac.in',
                phone: '+91 94440 12005',
                roleNames: ['INSTITUTION_ADMIN'],
                institutionId: 'INST-VIT-005',
                status: 'ACTIVE',
            },
            {
                fullName: 'P. Suresh (Endowment Desk)',
                email: 'endowment@vit.ac.in',
                phone: '+91 98411 77105',
                roleNames: ['INSTITUTION_STAFF'],
                institutionId: 'INST-VIT-005',
                status: 'ACTIVE',
            },
            {
                fullName: 'Dr. G. Aghila (Director NITT)',
                email: 'director@nitt.edu',
                phone: '+91 94440 12007',
                roleNames: ['INSTITUTION_ADMIN'],
                institutionId: 'INST-NITT-007',
                status: 'ACTIVE',
            },
            {
                fullName: 'M. Vignesh (Accounts Clerk)',
                email: 'vignesh.acc@nitt.edu',
                phone: '+91 98411 77107',
                roleNames: ['INSTITUTION_STAFF'],
                institutionId: 'INST-NITT-007',
                status: 'PENDING_ACTIVATION',
            },
            {
                fullName: 'Dr. M. Palaninatha Raja',
                email: 'principal@tce.edu',
                phone: '+91 94440 12003',
                roleNames: ['INSTITUTION_ADMIN'],
                institutionId: 'INST-TCE-003',
                status: 'INACTIVE',
            },
        ];
        console.log(`Processing ${userDefinitions.length} portal users...\n`);
        let createdCount = 0;
        let updatedCount = 0;
        for (const def of userDefinitions) {
            const roleIds = def.roleNames.map((r) => roleMap.get(r));
            const existing = await User_model_1.User.findOne({ email: def.email });
            if (existing) {
                existing.fullName = def.fullName;
                existing.phone = def.phone;
                existing.roles = roleIds;
                existing.status = def.status;
                existing.institutionId = def.institutionId;
                existing.passwordHash = defaultPasswordHash;
                await existing.save();
                console.log(`  🔄 Updated User : [${def.email}] -> Roles: ${def.roleNames.join(', ')} (${def.status})`);
                updatedCount++;
            }
            else {
                await User_model_1.User.create({
                    fullName: def.fullName,
                    email: def.email,
                    phone: def.phone,
                    passwordHash: defaultPasswordHash,
                    roles: roleIds,
                    institutionId: def.institutionId,
                    status: def.status,
                    failedLoginAttempts: 0,
                });
                console.log(`  ✨ Created User : [${def.email}] -> Roles: ${def.roleNames.join(', ')} (${def.status})`);
                createdCount++;
            }
        }
        console.log('\n============================================================');
        console.log(`✅ PORTAL USERS SEEDING COMPLETE`);
        console.log(`   Created: ${createdCount}`);
        console.log(`   Updated: ${updatedCount}`);
        console.log(`   Default Password for all: Admin@123`);
        console.log('============================================================\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during users seeding:', error);
        process.exit(1);
    }
}
seedPortalUsers();
