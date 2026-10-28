"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacRepository = exports.RbacRepository = void 0;
const Role_model_1 = require("../../models/Role.model");
const Permission_model_1 = require("../../models/Permission.model");
class RbacRepository {
    async findAllRoles() {
        return Role_model_1.Role.find().populate('permissions').sort({ name: 1 });
    }
    async findRoleById(id) {
        return Role_model_1.Role.findById(id).populate('permissions');
    }
    async findRoleByName(name) {
        return Role_model_1.Role.findOne({ name: name.toUpperCase() });
    }
    async createRole(data) {
        const created = await Role_model_1.Role.create({
            name: data.name.toUpperCase(),
            displayName: data.displayName,
            description: data.description,
            permissions: data.permissionIds,
            isSystemRole: false,
        });
        return (await this.findRoleById(created._id.toString()));
    }
    async updateRole(id, data) {
        const updatePayload = {};
        if (data.displayName !== undefined)
            updatePayload.displayName = data.displayName;
        if (data.description !== undefined)
            updatePayload.description = data.description;
        if (data.permissionIds !== undefined)
            updatePayload.permissions = data.permissionIds;
        return Role_model_1.Role.findByIdAndUpdate(id, updatePayload, { new: true }).populate('permissions');
    }
    async findAllPermissions() {
        return Permission_model_1.Permission.find().sort({ resource: 1, action: 1 });
    }
}
exports.RbacRepository = RbacRepository;
exports.rbacRepository = new RbacRepository();
