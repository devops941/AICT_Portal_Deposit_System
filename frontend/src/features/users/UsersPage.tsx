import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  UserPlus,
  MoreVertical,
  Building2,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  institutionId?: string;
  roles: Array<{ id: string; name: string; displayName: string }>;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';
  lastLogin?: string;
}

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
}

export const UsersPage: React.FC = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const canUpdate = hasPermission('USERS:UPDATE');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [createPassword, setCreatePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);

  // Action Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res: any = await apiClient.get('/v1/users', { params });
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res: any = await apiClient.get('/v1/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [search, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await apiClient.post('/v1/users', {
        fullName,
        email,
        phone,
        institutionId: institutionId || undefined,
        roleIds: selectedRoleIds,
        password: createPassword || undefined,
      });

      setIsCreateOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setInstitutionId('');
      setSelectedRoleIds([]);
      setCreatePassword('');
      fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (user: UserItem, newStatus: string) => {
    try {
      await apiClient.patch(`/v1/users/${user.id}/status`, { status: newStatus });
      fetchUsers();
      setActiveMenuId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditPhone(user.phone);
    setEditRoleIds(user.roles.map((r) => r.id));
    setActiveMenuId(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);

    try {
      await apiClient.patch(`/v1/users/${editingUser.id}`, {
        fullName: editFullName,
        phone: editPhone,
        roleIds: editRoleIds,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage institutional users, verification officers, and role assignments across colleges.
          </p>
        </div>

        {hasPermission('USERS:CREATE') && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl px-4 py-2 text-xs font-semibold shadow-sm shadow-primary-600/30 gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        )}
      </div>

      {/* Main Table Card Container */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm bg-white">
        {/* Integrated Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-medium rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_ACTIVATION">Pending</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers()}
              className="gap-1.5 font-medium text-xs py-2 h-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">User / Contact</th>
                <th className="py-3.5 px-6">Institution</th>
                <th className="py-3.5 px-6">Assigned Roles</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {isLoading ? 'Loading users...' : 'No users found matching query.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isActiveMenu = activeMenuId === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name / Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <Avatar name={u.fullName} size="md" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900 text-xs">{u.fullName}</p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{u.phone}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Institution */}
                      <td className="py-4 px-6">
                        {u.institutionId ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-slate-700 font-medium text-xs">
                            <Building2 className="w-3.5 h-3.5 text-primary-600" />
                            <span>{u.institutionId}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">AICTE Headquarters</span>
                        )}
                      </td>

                      {/* Assigned Roles */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.map((r) => (
                            <span
                              key={r.id || r.name}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-primary-50 text-primary-700 border border-primary-200/60 font-medium text-[11px]"
                            >
                              {r.displayName || r.name.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {u.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        )}
                        {u.status === 'INACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                        {u.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Suspended
                          </span>
                        )}
                        {u.status === 'PENDING_ACTIVATION' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right relative">
                        {canUpdate ? (
                          <div className="relative inline-block text-left" ref={isActiveMenu ? menuRef : undefined}>
                            <button
                              onClick={() => setActiveMenuId(isActiveMenu ? null : u.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isActiveMenu && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Edit Details</span>
                                </button>

                                {u.status === 'ACTIVE' ? (
                                  <button
                                    onClick={() => handleUpdateStatus(u, 'INACTIVE')}
                                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Deactivate User</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateStatus(u, 'ACTIVE')}
                                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Activate User</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 italic">Read-only</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-700">{users.length}</strong> registered users</span>
          <span className="text-[11px] text-slate-400">Institutional records synced</span>
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New User"
        description="Provision an institutional administrator, verification officer, or staff member."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. Dr. Rajesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. rajesh@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Institution ID (Optional for AICTE Officers)"
              placeholder="e.g. INST-1002"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Assign Roles</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {roles.map((r) => {
                const isSelected = selectedRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-primary-50 font-semibold text-primary-800' : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedRoleIds((prev) =>
                          isSelected ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                        );
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span>{r.displayName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Input
            label="Temporary Password (Leave blank for default: Welcome@123)"
            type="password"
            placeholder="Optional custom password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.fullName}`}
          description="Update contact information and role assignments."
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <Input
              label="Full Name"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Role Assignments</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {roles.map((r) => {
                  const isSelected = editRoleIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        isSelected ? 'bg-primary-50 font-bold text-primary-800' : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setEditRoleIds((prev) =>
                            isSelected ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                          );
                        }}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                      <span>{r.displayName}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
