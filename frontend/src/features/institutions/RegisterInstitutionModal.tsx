import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { apiClient } from '../../services/apiClient';
import { InstitutionType } from './types';

interface RegisterInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterInstitutionModal: React.FC<RegisterInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [aicteId, setAicteId] = useState('');
  const [institutionType, setInstitutionType] = useState<InstitutionType>('SELF_FINANCING_PRIVATE');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [administratorName, setAdministratorName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await apiClient.post('/v1/institutions', {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        aicteId: aicteId.trim() || undefined,
        institutionType,
        address: address.trim(),
        state: state.trim(),
        district: district.trim(),
        pincode: pincode.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        administratorName: administratorName.trim() || undefined,
      });

      onSuccess();
      onClose();
      // Reset form
      setName('');
      setCode('');
      setAicteId('');
      setAddress('');
      setState('');
      setDistrict('');
      setPincode('');
      setContactEmail('');
      setContactPhone('');
      setAdministratorName('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register institution');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Institution"
      description="Onboard an accredited college or technical institute for AICTE deposit and FDR tracking."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Institution Name"
            placeholder="e.g. National Institute of Technology"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Institution Code (Unique Identifier)"
            placeholder="e.g. INST-NIT-004"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="AICTE Permanent ID (Optional)"
            placeholder="e.g. 1-332910411"
            value={aicteId}
            onChange={(e) => setAicteId(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">Institution Category</label>
            <select
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="CENTRAL_UNIVERSITY">Central University</option>
              <option value="STATE_UNIVERSITY">State University</option>
              <option value="GOVT_ENGINEERING_COLLEGE">Government Engineering College</option>
              <option value="GOVT_AIDED_COLLEGE">Government Aided College</option>
              <option value="SELF_FINANCING_PRIVATE">Self-Financing Private Institute</option>
              <option value="AUTONOMOUS_INSTITUTE">Autonomous Institute</option>
              <option value="DEEMED_TO_BE_UNIVERSITY">Deemed to be University</option>
              <option value="OTHER">Other Technical Institute</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-700">Campus Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="Complete postal address of the institution campus..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Input
            label="State"
            placeholder="e.g. Tamil Nadu"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
          <Input
            label="District"
            placeholder="e.g. Coimbatore"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            required
          />
          <Input
            label="Pincode (6 Digits)"
            placeholder="e.g. 641001"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Official Contact Email"
            type="email"
            placeholder="principal@college.edu"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
          <Input
            label="Official Contact Phone"
            placeholder="+91-44-2233-4455"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />
        </div>

        <Input
          label="Institution Administrator / Principal Name"
          placeholder="e.g. Dr. A. Ramanathan"
          value={administratorName}
          onChange={(e) => setAdministratorName(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isLoading}>
            Register Institution
          </Button>
        </div>
      </form>
    </Modal>
  );
};
