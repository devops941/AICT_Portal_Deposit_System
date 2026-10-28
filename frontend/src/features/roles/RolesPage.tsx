import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

interface PermissionItem {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string;
}

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  permissions: PermissionItem[];
  createdAt: string;
  updatedAt: string;
}

const RESOURCE_LABELS: Record<string, string> = {
  USERS: 'User & Staff Accounts',
  ROLES: 'Role & RBAC Security',
  INSTITUTIONS: 'College / Institute Profiles',
  DEPOSITS: 'Security Deposit Applications',
  FDR: 'Fixed Deposit Receipts (FDR)',
  AUDIT: 'Audit Logs & Trails',
  REPORTS: 'Analytics & Compliance Reports',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  READ: 'bg-blue-50 text-blue-700 border-blue-200',
  UPDATE: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  SUBMIT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  VERIFY: 'bg-violet-50 text-violet-700 border-violet-200',
  APPROVE: 'bg-teal-50 text-teal-700 border-teal-200',
  REJECT: 'bg-orange-50 text-orange-700 border-orange-200',
  EXPORT: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const RolesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canUpdateRole = hasPermission('ROLES:UPDATE');
  const canCreateRole = hasPermission('ROLES:CREATE');

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');
  const [matrixSelectedRoleId, setMatrixSelectedRoleId] = useState<string>('');

  // Edit Role Modal
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Create Role Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPermissionIds, setCreatePermissionIds] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes]: any[] = await Promise.all([
        apiClient.get('/v1/roles'),
        apiClient.get('/v1/permissions'),
      ]);

      const fetchedRoles: RoleItem[] = rolesRes.data || [];
      const fetchedPerms: PermissionItem[] = permsRes.data || [];

      setRoles(fetchedRoles);
      setPermissions(fetchedPerms);

      if (fetchedRoles.length > 0 && !matrixSelectedRoleId) {
        setMatrixSelectedRoleId(fetchedRoles[0].id);
      }
    } catch (err) {
      console.error('Failed to load RBAC data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (role: RoleItem) => {
    setEditingRole(role);
    setEditDisplayName(role.displayName);
    setEditDescription(role.description);
    setSelectedPermissionIds(role.permissions.map((p) => p.id));
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res: any = await apiClient.patch(`/v1/roles/${editingRole.id}`, {
        displayName: editDisplayName,
        description: editDescription,
        permissionIds: selectedPermissionIds,
      });

      // Update state
      setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? res.data : r)));
      setSaveSuccess(`Role "${res.data.displayName}" permissions updated successfully.`);
      setTimeout(() => {
        setEditingRole(null);
        setSaveSuccess(null);
      }, 1200);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to update role permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createPermissionIds.length === 0) {
      setCreateError('Please select at least one permission.');
      return;
    }

    setIsSaving(true);
    setCreateError(null);

    try {
      const res: any = await apiClient.post('/v1/roles', {
        name: createName.trim().toUpperCase().replace(/\s+/g, '_'),
        displayName: createDisplayName.trim(),
        description: createDescription.trim(),
        permissionIds: createPermissionIds,
      });

      setRoles((prev) => [...prev, res.data]);
      setIsCreateOpen(false);
      setCreateName('');
      setCreateDisplayName('');
      setCreateDescription('');
      setCreatePermissionIds([]);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create new role.');
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by resource
  const permissionsByResource = permissions.reduce<Record<string, PermissionItem[]>>((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  const togglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleAllForResource = (resource: string) => {
    const resourcePermIds = (permissionsByResource[resource] || []).map((p) => p.id);
    const allSelected = resourcePermIds.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      // Remove all
      setSelectedPermissionIds((prev) => prev.filter((id) => !resourcePermIds.includes(id)));
    } else {
      // Add all
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...resourcePermIds])));
    }
  };

  const currentMatrixRole = roles.find((r) => r.id === matrixSelectedRoleId);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Roles & Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system roles, govern permission mappings across core domains, and manage authority scopes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
            className="gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Permissions</span>
          </Button>

          {canCreateRole && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2 text-xs">
              <Plus className="w-4 h-4" />
              <span>New Custom Role</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('cards')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'cards'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Configured Roles ({roles.length})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'matrix'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Access Control Matrix ({permissions.length} Permissions)</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab 1: Roles Cards Overview */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((role) => {
            const isSuperAdmin = role.name === 'SYSTEM_ADMINISTRATOR';

            // Group permissions for this role by resource
            const roleResources = Array.from(
              new Set(role.permissions.map((p) => p.resource))
            );

            return (
              <Card
                key={role.id}
                className="flex flex-col justify-between hover:shadow-md transition-all duration-200 border-slate-200/80"
              >
                <div className="p-5 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                      {isSuperAdmin ? (
                        <ShieldAlert className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Shield className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {role.isSystemRole ? (
                        <Badge variant="outline" className="text-[10px] bg-slate-50 font-medium">
                          System Role
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] font-medium">
                          Custom
                        </Badge>
                      )}
                      <span className="text-[10px] font-mono text-slate-400">
                        {role.name}
                      </span>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {role.displayName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  {/* Capability stats */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Granted Scope:</span>
                    <span className="font-bold text-slate-900">
                      {isSuperAdmin ? 'Full Access (All 54/54)' : `${role.permissions.length} Actions`}
                    </span>
                  </div>

                  {/* Resource Badges */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Target Domains:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {roleResources.map((res) => (
                        <span
                          key={res}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700"
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Updated {new Date(role.updatedAt).toLocaleDateString()}
                  </span>
                  {canUpdateRole ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(role)}
                      className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 text-xs font-semibold gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Configure Permissions</span>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Read-Only
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: Access Control Matrix */}
      {activeTab === 'matrix' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Permission Matrix Inspector</h3>
              <p className="text-xs text-slate-500">
                Inspect which actions are authorized for each system role across resources.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Inspect Role:
              </label>
              <select
                value={matrixSelectedRoleId}
                onChange={(e) => setMatrixSelectedRoleId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName} ({r.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentMatrixRole && (
            <div className="space-y-6">
              {Object.entries(permissionsByResource).map(([resourceKey, resourcePerms]) => {
                const assignedPermCodes = currentMatrixRole.permissions.map((p) => p.code);
                const isSuperAdmin = currentMatrixRole.name === 'SYSTEM_ADMINISTRATOR';

                return (
                  <div key={resourceKey} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-600"></span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          {RESOURCE_LABELS[resourceKey] || resourceKey}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          [{resourceKey}]
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {resourcePerms.map((perm) => {
                        const hasThis = isSuperAdmin || assignedPermCodes.includes(perm.code);

                        return (
                          <div
                            key={perm.id}
                            className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                              hasThis
                                ? 'bg-emerald-50/40 border-emerald-200/70 text-slate-900'
                                : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                            }`}
                          >
                            <div className="mt-0.5">
                              {hasThis ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                    ACTION_COLORS[perm.action] || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {perm.action}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  {perm.code}
                                </span>
                              </div>
                              <p className="text-[11px] leading-tight">
                                {perm.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <Modal
          isOpen={Boolean(editingRole)}
          onClose={() => setEditingRole(null)}
          title={`Configure Role: ${editingRole.displayName}`}
          description={`Select which actions this role is authorized to execute in the portal.`}
        >
          <form onSubmit={handleSaveRole} className="space-y-5">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Role Display Name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                required
              />
              <Input
                label="System Identifier (Immutable)"
                value={editingRole.name}
                disabled
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Granular Permission Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Granular Permissions ({selectedPermissionIds.length} Selected)
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissionIds(permissions.map((p) => p.id))}
                    className="text-[11px] py-1 h-7"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPermissionIds([])}
                    className="text-[11px] py-1 h-7"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
                {Object.entries(permissionsByResource).map(([res, perms]) => {
                  const allResSelected = perms.every((p) => selectedPermissionIds.includes(p.id));

                  return (
                    <div
                      key={res}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">
                          {RESOURCE_LABELS[res] || res}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleAllForResource(res)}
                          className="text-[10px] font-semibold text-primary-600 hover:text-primary-800"
                        >
                          {allResSelected ? 'Deselect Resource' : 'Select All Resource'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p) => {
                          const isChecked = selectedPermissionIds.includes(p.id);

                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer text-xs border transition-colors ${
                                isChecked
                                  ? 'bg-primary-50/70 border-primary-200 font-medium text-slate-900'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(p.id)}
                                className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1 py-0.2 rounded text-[9px] font-bold border ${
                                      ACTION_COLORS[p.action] || 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {p.action}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {p.code}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {p.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingRole(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSaving}>
                Save Role Configuration
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Custom Role Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Custom Role"
          description="Define a new role with a specialized set of permissions."
        >
          <form onSubmit={handleCreateRole} className="space-y-4">
            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{createError}</span>
              </div>
            )}

            <Input
              label="System Name (e.g. REGIONAL_DIRECTOR)"
              placeholder="e.g. REGIONAL_DIRECTOR"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
            />
            <Input
              label="Display Name"
              placeholder="e.g. Regional Director"
              value={createDisplayName}
              onChange={(e) => setCreateDisplayName(e.target.value)}
              required
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={2}
                placeholder="Responsibilities and access scope of this role..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Initial Permissions ({createPermissionIds.length} Selected)
              </label>
              <div className="max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                {permissions.map((p) => {
                  const isChecked = createPermissionIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-white text-xs cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setCreatePermissionIds((prev) =>
                            isChecked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          );
                        }}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span className="font-mono text-[10px] text-slate-500">{p.code}</span>
                      <span className="text-slate-700">- {p.description}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSaving}>
                Create Role
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
