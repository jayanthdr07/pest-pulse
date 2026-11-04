import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  ChevronDown,
  Sprout,
  Radio,
  Layers,
  QrCode,
  CloudSun,
  Settings,
  Box,
  Globe,
  FlaskConical,
  Activity,
} from 'lucide-react';
import { NAV_GROUPS, NavGroupConfig } from '../config/navConfig';
import { useApp } from '../context/AppContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    language,
    setLanguage,
    demoMode,
    setDemoMode,
    unreadAlertsCount,
    t,
  } = useApp();

  // Accordion state: by default, the group containing the active page is open
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => {
    const found = NAV_GROUPS.find((g) =>
      g.items.some((item) =>
        item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
      )
    );
    return found ? found.id : 'monitor';
  });

  if (!isOpen) return null;

  const toggleGroup = (groupId: string) => {
    setExpandedGroup((prev) => (prev === groupId ? null : groupId));
  };

  const handleNavigate = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className="relative w-80 max-w-[85vw] h-full bg-white border-r border-[#E2E8DF] text-[#2D3E2F] flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Drawer"
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-[#E2E8DF] flex items-center justify-between bg-[#F4F6F3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#2D3E2F] flex items-center justify-center text-white shadow-xs shrink-0 border border-emerald-400/20">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-black text-[#2D3E2F] text-base tracking-tight">
                <span>PestPulse</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EBF7EE] text-[#2E7D32] font-extrabold border border-[#C8E6C9]">
                  2.0
                </span>
              </div>
              <p className="text-[11px] text-[#556857]">
                {language === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್' : 'Smart Agriculture'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#556857] hover:text-[#2D3E2F] hover:bg-[#EAEFE8] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Hardware Status Pill */}
        <div className="px-4 py-2 bg-[#EBF7EE] border-b border-[#C8E6C9] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  demoMode ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  demoMode ? 'bg-amber-500' : 'bg-[#2E7D32]'
                }`}
              />
            </span>
            <span className="text-[#2E7D32] font-bold text-[11px]">
              {demoMode ? 'DEMO SIMULATION' : 'ESP32-CAM CONNECTED'}
            </span>
          </div>
          <span className="text-[10px] text-[#556857] font-mono flex items-center gap-1">
            <Radio className="w-3 h-3 text-[#2E7D32]" />
            915MHz
          </span>
        </div>

        {/* Navigation List (Accordions for the 5 groups) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {NAV_GROUPS.map((group) => {
            const isAccordion = group.id !== 'overview';
            const isExpanded = expandedGroup === group.id;
            const GroupIcon = group.icon || group.items[0]?.icon;

            // Direct link for Home
            if (!isAccordion) {
              const homeItem = group.items[0];
              const HomeIcon = homeItem.icon;
              const isActive = location.pathname === '/';

              return (
                <button
                  key={group.id}
                  onClick={() => handleNavigate('/')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
                    isActive
                      ? 'bg-[#EBF7EE] text-[#2E7D32] font-bold border border-[#C8E6C9]'
                      : 'text-[#556857] hover:text-[#2D3E2F] hover:bg-[#F4F6F3]'
                  }`}
                >
                  <HomeIcon className="w-5 h-5 text-[#2E7D32] shrink-0" />
                  <span>{language === 'kn' ? group.titleKn : group.title}</span>
                </button>
              );
            }

            // Accordion Groups (Monitor, Scan, Act, Help)
            const isAnyActive = group.items.some((item) =>
              item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
            );

            return (
              <div key={group.id} className="rounded-xl overflow-hidden bg-[#F4F6F3] border border-[#E2E8DF]">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 text-sm font-bold min-h-[44px] cursor-pointer transition-colors ${
                    isAnyActive ? 'text-[#2E7D32]' : 'text-[#2D3E2F]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {GroupIcon && <GroupIcon className="w-4 h-4 text-[#2E7D32] shrink-0" />}
                    <span>{language === 'kn' ? group.titleKn : group.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#556857] transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-[#2E7D32]' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-2 pb-2 space-y-1 border-t border-[#E2E8DF] pt-1 bg-white">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = item.exact
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);

                      return (
                        <button
                          key={item.to}
                          onClick={() => handleNavigate(item.to)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all min-h-[44px] cursor-pointer ${
                            isCurrent
                              ? 'bg-[#EBF7EE] text-[#2E7D32] font-bold border border-[#C8E6C9]'
                              : 'text-[#556857] hover:text-[#2D3E2F] hover:bg-[#F4F6F3]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-[#2E7D32]' : 'text-[#556857]'}`} />
                            <div className="truncate">
                              <div className="text-xs font-semibold truncate">
                                {language === 'kn' && item.labelKn ? item.labelKn : item.label}
                              </div>
                              <div className={`text-[10px] truncate ${isCurrent ? 'text-[#2E7D32]/80' : 'text-[#556857]/80'}`}>
                                {language === 'kn' && item.descriptionKn ? item.descriptionKn : item.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {item.badge && (
                              <span
                                className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#EBF7EE] text-[#2E7D32] border border-[#C8E6C9]"
                              >
                                {item.badge}
                              </span>
                            )}
                            {item.showUnreadCount && unreadAlertsCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-[#D97746] text-white text-[10px] font-black animate-pulse">
                                {unreadAlertsCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Profile Section inside Drawer */}
          <div className="pt-3 border-t border-[#E2E8DF] space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#556857]">
              {language === 'kn' ? 'ಖಾತೆ ವಿವರಗಳು' : 'Profile & Management'}
            </div>

            <button
              onClick={() => handleNavigate('/fields')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] min-h-[44px] cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#2E7D32]" />
              <span>{t('nav_fields') || 'My Fields'}</span>
            </button>

            <button
              onClick={() => handleNavigate('/passport')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] min-h-[44px] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-[#2E7D32]" />
                <span>{t('nav_passport') || 'Crop Passport'}</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#2E7D32] text-white">QR</span>
            </button>

            <button
              onClick={() => handleNavigate('/weather')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] min-h-[44px] cursor-pointer"
            >
              <CloudSun className="w-4 h-4 text-blue-600" />
              <span>{t('nav_weather') || 'Weather Forecast'}</span>
            </button>

            <button
              onClick={() => handleNavigate('/3d-demo')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] min-h-[44px] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Box className="w-4 h-4 text-amber-600" />
                <span>{t('nav_3d_demo') || '3D Field View'}</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-stone-950">3D</span>
            </button>

            <button
              onClick={() => handleNavigate('/settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] min-h-[44px] cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#556857]" />
              <span>{t('nav_settings') || 'Settings'}</span>
            </button>
          </div>
        </div>

        {/* Footer info & preferences */}
        <div className="p-3 border-t border-[#E2E8DF] bg-[#F4F6F3] space-y-2">
          {/* Language selection */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#556857] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#556857]" />
              <span>Language</span>
            </span>
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#E2E8DF]">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  language === 'en' ? 'bg-[#2E7D32] text-white' : 'text-[#556857]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold font-kannada ${
                  language === 'kn' ? 'bg-[#2E7D32] text-white' : 'text-[#556857]'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>

          {/* Demo toggle */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E2E8DF]">
            <span className="text-[#556857] flex items-center gap-1.5">
              {demoMode ? <FlaskConical className="w-3.5 h-3.5 text-amber-600" /> : <Activity className="w-3.5 h-3.5 text-[#2E7D32]" />}
              <span>{demoMode ? 'Demo Mode' : 'Live Hardware'}</span>
            </span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="px-2 py-0.5 rounded text-[11px] font-bold border border-[#E2E8DF] bg-white text-[#2D3E2F] hover:bg-[#EAEFE8]"
            >
              {demoMode ? 'To Live' : 'To Demo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};