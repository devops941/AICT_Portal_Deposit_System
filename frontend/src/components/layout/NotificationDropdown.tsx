import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  CheckCheck,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { apiClient as api } from '../../services/apiClient';

export interface NotificationItem {
  _id: string;
  notificationId: string;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/v1/notifications?limit=10');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignored
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/v1/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'MATURITY_ALERT') return <Clock className="w-4 h-4 text-amber-500" />;
    if (type === 'DISCREPANCY_FLAG') return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    if (type === 'VERIFICATION_UPDATE') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    return <Bell className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                <span>No notifications to display</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    !notif.isRead ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getTypeIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 truncate text-[11px]">{notif.title}</h4>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 pt-1 text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {notif.channel}
                      </span>
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.notificationId, e)}
                          className="font-semibold text-indigo-600 hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
