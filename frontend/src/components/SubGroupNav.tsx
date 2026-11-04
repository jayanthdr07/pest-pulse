import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Bug,
  LineChart,
  Cpu,
  UploadCloud,
  HeartPulse,
  ShieldCheck,
  Bell,
  Brain,
  Mic,
  Video,
} from 'lucide-react';

interface SubNavItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  count?: number;
}

export const SubGroupNav: React.FC = () => {
  const location = useLocation();
  const { unreadAlertsCount } = useApp();

  const groups: Record<string, { title: string; items: SubNavItem[] }> = {
    monitor: {
      title: 'MONITOR',
      items: [
        { to: '/trap-gallery', label: 'Trap Gallery', icon: Camera, badge: 'Live' },
        { to: '/monitoring', label: 'Insect Monitoring', icon: Bug },
        { to: '/trends', label: 'Historical Trends', icon: LineChart },
        { to: '/devices', label: 'Devices', icon: Cpu },
      ],
    },
    scan: {
      title: 'SCAN & DIAGNOSE',
      items: [
        { to: '/photo-count', label: 'Photo Count', icon: UploadCloud, badge: 'AI' },
        { to: '/diseases', label: 'Crop Diseases', icon: HeartPulse },
      ],
    },
    act: {
      title: 'ACT',
      items: [
        { to: '/recommendations', label: 'Recommendations', icon: ShieldCheck },
        { to: '/alerts', label: 'Alerts', icon: Bell, count: unreadAlertsCount },
        { to: '/intelligence', label: 'Crop Intelligence', icon: Brain },
      ],
    },
    help: {
      title: 'HELP',
      items: [
        { to: '/voice', label: 'Voice Agent', icon: Mic, badge: 'TTS' },
        { to: '/consultation', label: 'Expert Video', icon: Video, badge: 'Jitsi' },
      ],
    },
  };

  // Detect which group current page belongs to
  let activeGroupKey: string | null = null;
  if (['/trap-gallery', '/monitoring', '/trends', '/devices'].some((p) => location.pathname.startsWith(p))) {
    activeGroupKey = 'monitor';
  } else if (['/photo-count', '/diseases'].some((p) => location.pathname.startsWith(p))) {
    activeGroupKey = 'scan';
  } else if (['/recommendations', '/alerts', '/intelligence'].some((p) => location.pathname.startsWith(p))) {
    activeGroupKey = 'act';
  } else if (['/voice', '/consultation'].some((p) => location.pathname.startsWith(p))) {
    activeGroupKey = 'help';
  }

  if (!activeGroupKey) return null;

  const activeGroup = groups[activeGroupKey];

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl overflow-x-auto scrollbar-none shadow-xs border border-[#E2E8DF]">
        {activeGroup.items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[40px] shrink-0 select-none ${
                isActive
                  ? 'bg-[#EBF7EE] text-[#2E7D32] shadow-xs font-bold border border-[#C8E6C9]'
                  : 'text-[#556857] hover:text-[#2D3E2F] hover:bg-[#F4F6F3]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#2E7D32]' : 'text-[#556857]'
                }`}
              />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-white text-[#2E7D32] border border-[#C8E6C9]' : 'bg-[#F4F6F3] text-[#556857] border border-[#E2E8DF]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {item.count !== undefined && item.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#D97746] text-white text-[10px] font-extrabold animate-pulse">
                  {item.count}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
