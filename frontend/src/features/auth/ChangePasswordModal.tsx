import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/v1/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccessMessage('Password changed successfully!');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" description="Update your security password">
      {errorMessage && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-700 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Input
          label="New Password"
          type="password"
          placeholder="Minimum 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};
