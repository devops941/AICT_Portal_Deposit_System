import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, KeyRound, LogOut, ChevronDown, UserCheck } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordModal } from '../../features/auth/ChangePasswordModal';
import { NotificationDropdown } from './NotificationDropdown';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const displayName = user?.fullName || 'User Profile';
  const displayEmail = user?.email || '';
  const displayRole = user?.roles?.[0]
    ? user.roles[0].replace(/_/g, ' ')
    : user?.userType === 'ADMIN'
    ? 'System Administrator'
    : 'Portal User';

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* Left: Responsive Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative w-72 sm:w-80 md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search deposits, FDRs, users..."
              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            
          </div>
        </div>

        {/* Right: Quick Controls, Date, Notifications & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
        

          {/* Date Display */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/70 px-2.5 py-1.5 rounded-xl">
            <span className="text-[11px]">{currentDate}</span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Live In-App Notifications */}
          <NotificationDropdown />

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-2.5 py-1 pr-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left focus:outline-none"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[150px]">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5 truncate max-w-[150px]">
                  {displayRole.toLowerCase()}
                </p>
              </div>
              <div className="relative">
                <Avatar name={displayName} size="md" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{displayEmail}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {displayRole}
                    </span>
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsChangePasswordOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span>Change Password</span>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};
