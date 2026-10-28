"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbacService = exports.RbacService = void 0;
const appError_1 = require("../../utils/appError");
const rbac_repository_1 = require("./rbac.repository");
class RbacService {
    repository;
    constructor(repository = rbac_repository_1.rbacRepository) {
        this.repository = repository;
    }
    mapRole(role) {
        return {
            id: role._id.toString(),
            name: role.name,
            displayName: role.displayName,
            description: role.description,
            isSystemRole: role.isSystemRole,
            permissions: (role.permissions || []).map((p) => ({
                id: p._id?.toString() || '',
                code: p.code,
                resource: p.resource,
                action: p.action,
                description: p.description,
            })),
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    }
    async getRoles() {
        const roles = await this.repository.findAllRoles();
        return roles.map(this.mapRole);
    }
    async createRole(input) {
        const existing = await this.repository.findRoleByName(input.name);
        if (existing) {
            throw appError_1.AppError.conflict(`Role with name "${input.name.toUpperCase()}" already exists`);
        }
        const created = await this.repository.createRole(input);
        return this.mapRole(created);
    }
    async updateRole(id, input) {
        const role = await this.repository.findRoleById(id);
        if (!role)
            throw appError_1.AppError.notFound('Role not found');
        const updated = await this.repository.updateRole(id, input);
        return this.mapRole(updated);
    }
    async getPermissions() {
        const permissions = await this.repository.findAllPermissions();
        return permissions.map((p) => ({
            id: p._id.toString(),
            code: p.code,
            resource: p.resource,
            action: p.action,
            description: p.description,
        }));
    }
}
exports.RbacService = RbacService;
exports.rbacService = new RbacService();
