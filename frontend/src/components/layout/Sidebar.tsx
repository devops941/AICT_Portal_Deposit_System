import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Landmark,
  FileCheck,
  FileSearch,
  Award,
  CalendarClock,
  RotateCcw,
  CreditCard,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface NavGroup {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    show: boolean;
  }[];
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { logout, hasPermission, hasRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Core & Institutions',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          show: true,
        },
        {
          to: '/institutions',
          label: 'Institutions',
          icon: Building2,
          show: hasPermission('INSTITUTIONS:READ'),
        },
      ],
    },
    {
      title: 'Instruments & Mandates',
      items: [
        {
          to: '/requirements',
          label: 'Deposit Requirements',
          icon: Landmark,
          show: hasPermission('DEPOSITS:READ'),
        },
        {
          to: '/fdrs',
          label: 'FDR Registry',
          icon: FileCheck,
          show: hasPermission('FDR:READ'),
        },
        {
          to: '/verifications',
          label: 'Verification Desk',
          icon: FileSearch,
          show:
            hasRole('VERIFICATION_OFFICER') ||
            hasRole('SENIOR_VERIFICATION_OFFICER') ||
            hasRole('APPROVING_AUTHORITY') ||
            hasRole('SYSTEM_ADMINISTRATOR') ||
            hasPermission('DEPOSITS:VERIFY') ||
            hasPermission('FDR:VERIFY'),
        },
        {
          to: '/approvals',
          label: 'Approval Center',
          icon: Award,
          show:
            hasRole('APPROVING_AUTHORITY') ||
            hasRole('SENIOR_VERIFICATION_OFFICER') ||
            hasRole('SYSTEM_ADMINISTRATOR') ||
            hasPermission('DEPOSITS:APPROVE') ||
            hasPermission('FDR:APPROVE'),
        },
      ],
    },
    {
      title: 'Lifecycle & Discharge',
      items: [
        {
          to: '/maturity',
          label: 'Maturity Radar',
          icon: CalendarClock,
          show: hasPermission('FDR:READ') || hasPermission('DEPOSITS:READ'),
        },
        {
          to: '/renewals',
          label: 'Renewals & Lineage',
          icon: RotateCcw,
          show: hasPermission('FDR:READ') || hasPermission('DEPOSITS:READ'),
        },
        {
          to: '/releases',
          label: 'Releases & Refunds',
          icon: CreditCard,
          show: hasPermission('FDR:READ') || hasPermission('DEPOSITS:READ'),
        },
      ],
    },
    {
      title: 'Reports & Analytics',
      items: [
        {
          to: '/reports',
          label: 'Statutory Reports',
          icon: FileSpreadsheet,
          show: hasPermission('REPORTS:READ'),
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          to: '/users',
          label: 'User Management',
          icon: Users,
          show: hasPermission('USERS:READ'),
        },
        {
          to: '/roles',
          label: 'Roles & Permissions',
          icon: ShieldCheck,
          show: hasPermission('ROLES:READ'),
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 z-30 select-none border-r border-slate-800/90 shadow-xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-slate-800/80 bg-slate-950/40 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/10 flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-white tracking-tight text-sm leading-tight truncate">
            AICTE Portal
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase truncate mt-0.5">
            Security Deposit System
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                {group.title}
              </div>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative',
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          <Icon
                            className={cn(
                              'w-4 h-4 transition-colors',
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            )}
                          />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto flex-shrink-0 animate-pulse" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom User & Sign Out Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors group"
        >
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
