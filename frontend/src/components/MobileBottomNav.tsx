import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Home,
  Camera,
  UploadCloud,
  ShieldCheck,
  HelpCircle,
  Bug,
  LineChart,
  Cpu,
  HeartPulse,
  Bell,
  Brain,
  Mic,
  Video,
  X,
  ChevronRight,
} from 'lucide-react';

interface SubPageItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  count?: number;
}

interface GroupDefinition {
  id: 'monitor' | 'act' | 'help';
  title: string;
  titleKn: string;
  items: SubPageItem[];
}

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, unreadAlertsCount } = useApp();
  const [activeSheet, setActiveSheet] = useState<GroupDefinition | null>(null);

  const groups: Record<'monitor' | 'act' | 'help', GroupDefinition> = {
    monitor: {
      id: 'monitor',
      title: 'MONITOR',
      titleKn: 'ಕಣ್ಗಾವಲು & ಉಪಕರಣ',
      items: [
        {
          to: '/trap-gallery',
          label: t('nav_trap_gallery') || 'Trap Camera Gallery',
          icon: Camera,
          badge: 'Live',
          badgeColor: 'bg-blue-600',
        },
        {
          to: '/monitoring',
          label: t('nav_monitoring') || 'Insect Monitoring',
          icon: Bug,
        },
        {
          to: '/trends',
          label: t('nav_trends') || 'Historical Trends',
          icon: LineChart,
        },
        {
          to: '/devices',
          label: t('nav_devices') || 'Devices',
          icon: Cpu,
        },
      ],
    },
    act: {
      id: 'act',
      title: 'ACT',
      titleKn: 'ಕೃಷಿ ಕ್ರಮ & ಎಚ್ಚರಿಕೆ',
      items: [
        {
          to: '/recommendations',
          label: t('nav_recommendations') || 'Recommendations',
          icon: ShieldCheck,
        },
        {
          to: '/alerts',
          label: t('nav_alerts') || 'Alerts',
          icon: Bell,
          count: unreadAlertsCount,
        },
        {
          to: '/intelligence',
          label: t('nav_intelligence') || 'Crop Intelligence',
          icon: Brain,
        },
      ],
    },
    help: {
      id: 'help',
      title: 'HELP',
      titleKn: 'ಸಹಾಯ & ತಜ್ಞರು',
      items: [
        {
          to: '/voice',
          label: t('nav_voice') || 'Voice Agent',
          icon: Mic,
          badge: 'TTS',
          badgeColor: 'bg-amber-600',
        },
        {
          to: '/consultation',
          label: t('nav_consultation') || 'Expert Consultation',
          icon: Video,
          badge: 'Jitsi',
          badgeColor: 'bg-teal-600',
        },
      ],
    },
  };

  const isMonitorActive = ['/trap-gallery', '/monitoring', '/trends', '/devices'].some((p) =>
    location.pathname.startsWith(p)
  );

  const isScanActive = ['/photo-count', '/diseases'].some((p) =>
    location.pathname.startsWith(p)
  );

  const isActActive = ['/recommendations', '/alerts', '/intelligence'].some((p) =>
    location.pathname.startsWith(p)
  );

  const isHelpActive = ['/voice', '/consultation'].some((p) =>
    location.pathname.startsWith(p)
  );

  const handleTabClick = (groupId: 'monitor' | 'act' | 'help') => {
    setActiveSheet(groups[groupId]);
  };

  const handleSubPageSelect = (path: string) => {
    setActiveSheet(null);
    navigate(path);
  };

  return (
    <>
      {/* Group Sub-Pages Bottom Sheet Modal */}
      {activeSheet && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveSheet(null)}
          />

          {/* Sheet Content */}
          <div className="relative bg-white border-t border-[#E2E8DF] rounded-t-3xl p-5 shadow-2xl z-10 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-[#2D3E2F]">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-[#E2E8DF] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8DF] mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#2E7D32]">
                  {language === 'kn' ? activeSheet.titleKn : activeSheet.title}
                </span>
                <h3 className="text-base font-bold text-[#2D3E2F]">
                  {language === 'kn' ? 'ವಿಭಾಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Destination'}
                </h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="p-2 rounded-xl bg-[#F4F6F3] text-[#556857] hover:text-[#2D3E2F] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {activeSheet.items.map((item) => {
                const Icon = item.icon;
                const isCurrent = location.pathname.startsWith(item.to);

                return (
                  <button
                    key={item.to}
                    onClick={() => handleSubPageSelect(item.to)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all min-h-[48px] cursor-pointer ${
                      isCurrent
                        ? 'bg-[#EBF7EE] text-[#2E7D32] font-bold border border-[#C8E6C9]'
                        : 'bg-[#F4F6F3] hover:bg-[#EAEFE8] text-[#2D3E2F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-[#2E7D32] text-white'
                            : 'bg-white text-[#2E7D32] border border-[#E2E8DF]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#EBF7EE] text-[#2E7D32] border border-[#C8E6C9]"
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.count !== undefined && item.count > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#D97746] text-white text-[10px] font-black animate-pulse">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 ${
                          isCurrent ? 'text-[#2E7D32]' : 'text-[#556857]'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Tab Bar (<1024px) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8DF] shadow-[0_-4px_20px_rgba(45,62,47,0.06)] px-2 py-1.5"
        role="navigation"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center">
          {/* 1. Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full min-h-[44px] py-1 transition-colors rounded-xl ${
                isActive ? 'text-[#2E7D32] font-bold' : 'text-[#556857] hover:text-[#2D3E2F]'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Home</span>
          </NavLink>

          {/* 2. Monitor Group */}
          <button
            onClick={() => handleTabClick('monitor')}
            className={`flex flex-col items-center justify-center w-full min-h-[44px] py-1 transition-colors rounded-xl cursor-pointer ${
              isMonitorActive ? 'text-[#2E7D32] font-bold' : 'text-[#556857] hover:text-[#2D3E2F]'
            }`}
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Monitor</span>
          </button>

          {/* 3. Scan & Diagnose (Larger Raised Centre Button in Terracotta) */}
          <div className="-mt-5 flex flex-col items-center">
            <button
              onClick={() => navigate('/photo-count')}
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer ring-4 ring-[#F4F6F3] ${
                isScanActive
                  ? 'bg-[#C26535] text-white scale-105'
                  : 'bg-[#D97746] hover:bg-[#C26535] text-white'
              }`}
              title="Scan Sticky Card / Canopy"
              aria-label="Scan & Count Insects"
            >
              <UploadCloud className="w-6 h-6 stroke-[2.2]" />
            </button>
            <span
              className={`text-[10px] font-bold mt-1 tracking-tight ${
                isScanActive ? 'text-[#D97746] font-black' : 'text-[#556857]'
              }`}
            >
              Scan
            </span>
          </div>

          {/* 4. Act Group */}
          <button
            onClick={() => handleTabClick('act')}
            className={`relative flex flex-col items-center justify-center w-full min-h-[44px] py-1 transition-colors rounded-xl cursor-pointer ${
              isActActive ? 'text-[#2E7D32] font-bold' : 'text-[#556857] hover:text-[#2D3E2F]'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#D97746] animate-ping" />
            )}
            <span className="text-[10px] font-medium tracking-tight">Act</span>
          </button>

          {/* 5. Help Group */}
          <button
            onClick={() => handleTabClick('help')}
            className={`flex flex-col items-center justify-center w-full min-h-[44px] py-1 transition-colors rounded-xl cursor-pointer ${
              isHelpActive ? 'text-[#2E7D32] font-bold' : 'text-[#556857] hover:text-[#2D3E2F]'
            }`}
          >
            <HelpCircle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">Help</span>
          </button>
        </div>
      </nav>
    </>
  );
};
