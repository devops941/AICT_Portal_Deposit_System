"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const User_model_1 = require("../../models/User.model");
class UserRepository {
    async findMany(query, accessibleInstitutionId) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const filter = {};
        if (accessibleInstitutionId) {
            filter.institutionId = accessibleInstitutionId;
        }
        else if (query.institutionId) {
            filter.institutionId = query.institutionId;
        }
        if (query.status) {
            filter.status = query.status;
        }
        if (query.roleId) {
            filter.roles = query.roleId;
        }
        if (query.search) {
            const searchRegex = new RegExp(query.search.trim(), 'i');
            filter.$or = [
                { fullName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
            ];
        }
        const [items, total] = await Promise.all([
            User_model_1.User.find(filter)
                .populate('roles')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User_model_1.User.countDocuments(filter),
        ]);
        return { items, total };
    }
    async findById(id) {
        return User_model_1.User.findById(id).populate('roles');
    }
    async findByEmail(email) {
        return User_model_1.User.findOne({ email: email.toLowerCase() });
    }
    async create(data) {
        const created = await User_model_1.User.create({
            fullName: data.fullName,
            email: data.email.toLowerCase(),
            phone: data.phone,
            passwordHash: data.passwordHash,
            institutionId: data.institutionId,
            roles: data.roleIds,
            status: data.status || 'ACTIVE',
            mustChangePassword: true,
        });
        return (await this.findById(created._id.toString()));
    }
    async update(id, data) {
        const updatePayload = {};
        if (data.fullName !== undefined)
            updatePayload.fullName = data.fullName;
        if (data.phone !== undefined)
            updatePayload.phone = data.phone;
        if (data.institutionId !== undefined)
            updatePayload.institutionId = data.institutionId;
        if (data.roleIds !== undefined)
            updatePayload.roles = data.roleIds;
        if (data.status !== undefined)
            updatePayload.status = data.status;
        return User_model_1.User.findByIdAndUpdate(id, updatePayload, { new: true }).populate('roles');
    }
    async updateStatus(id, status) {
        return User_model_1.User.findByIdAndUpdate(id, { status }, { new: true }).populate('roles');
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
