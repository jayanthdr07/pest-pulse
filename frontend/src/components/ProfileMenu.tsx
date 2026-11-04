import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  QrCode,
  Layers,
  CloudSun,
  Settings,
  Box,
  FlaskConical,
  Activity,
  Globe,
  HelpCircle,
  ChevronRight,
  X,
  MapPin,
} from 'lucide-react';

export const ProfileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    farmer,
    language,
    setLanguage,
    demoMode,
    setDemoMode,
    setOpenOnboarding,
    t,
  } = useApp();
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on route change
  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Trigger Button (minimum 44px touch target) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#2D3E2F] text-white font-bold text-sm shadow-xs border border-emerald-400/20 hover:ring-2 hover:ring-[#2E7D32] focus:outline-hidden flex items-center justify-center transition-all cursor-pointer"
        title="Farmer Profile & Menu"
        aria-label="User Profile & Quick Navigation"
      >
        <span>{getInitials(farmer?.name)}</span>
      </button>

      {/* Profile Dropdown / Slide-out Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-[18px] bg-white border border-[#E2E8DF] shadow-[0_16px_40px_rgba(45,62,47,0.14)] text-[#2D3E2F] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Card */}
          <div className="p-4 bg-gradient-to-br from-[#EBF7EE] to-[#F4F6F3] border-b border-[#E2E8DF]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2E7D32] text-white font-black text-base flex items-center justify-center shadow-xs border border-emerald-400/30">
                  {getInitials(farmer?.name)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2D3E2F] tracking-tight">
                    {farmer?.name || 'Ramesh Kumar'}
                  </h4>
                  <p className="text-xs text-[#556857] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#2E7D32] shrink-0" />
                    <span className="truncate">{farmer?.farm_place || 'Hesaraghatta, Bengaluru'}</span>
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-[#2E7D32] border border-[#C8E6C9]">
                    ID: {farmer?.farmer_id || 'KA-BLR-0492'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#556857] hover:text-[#2D3E2F] hover:bg-[#EAEFE8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Access Menu Items */}
          <div className="p-2 space-y-1 border-b border-[#E2E8DF]">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#556857]">
              {language === 'kn' ? 'ಖಾತೆ ಮತ್ತು ವಿವರಗಳು' : 'Profile & Management'}
            </div>

            <button
              onClick={() => handleNavigate('/fields')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F4F6F3] flex items-center justify-center text-[#2E7D32]">
                  <Layers className="w-4 h-4" />
                </div>
                <span>{t('nav_fields')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556857]" />
            </button>

            <button
              onClick={() => handleNavigate('/passport')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#EBF7EE] flex items-center justify-center text-[#2E7D32] border border-[#C8E6C9]">
                  <QrCode className="w-4 h-4" />
                </div>
                <span>{t('nav_passport')}</span>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#2E7D32] text-white">
                QR
              </span>
            </button>

            <button
              onClick={() => handleNavigate('/weather')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F4F6F3] flex items-center justify-center text-blue-600">
                  <CloudSun className="w-4 h-4" />
                </div>
                <span>{t('nav_weather')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556857]" />
            </button>

            <button
              onClick={() => handleNavigate('/3d-demo')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200">
                  <Box className="w-4 h-4" />
                </div>
                <span>{t('nav_3d_demo')}</span>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-stone-950">
                3D
              </span>
            </button>

            <button
              onClick={() => handleNavigate('/settings')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#2D3E2F] hover:bg-[#F4F6F3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F4F6F3] flex items-center justify-center text-[#556857]">
                  <Settings className="w-4 h-4" />
                </div>
                <span>{t('nav_settings')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556857]" />
            </button>
          </div>

          {/* Preferences & Hardware Controls */}
          <div className="p-3 bg-[#F4F6F3] space-y-3">
            {/* Language Selection */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#556857] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#556857]" />
                <span>{language === 'kn' ? 'ಭಾಷೆ / Language' : 'Language'}</span>
              </span>
              <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#E2E8DF]">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    language === 'en'
                      ? 'bg-[#2E7D32] text-white shadow-2xs'
                      : 'text-[#556857] hover:text-[#2D3E2F]'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('kn')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold font-kannada transition-all ${
                    language === 'kn'
                      ? 'bg-[#2E7D32] text-white shadow-2xs'
                      : 'text-[#556857] hover:text-[#2D3E2F]'
                  }`}
                >
                  ಕನ್ನಡ
                </button>
              </div>
            </div>

            {/* Hardware / Simulated Switch */}
            <div className="pt-2 border-t border-[#E2E8DF] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#556857]">
                {demoMode ? (
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-[#2E7D32] animate-pulse" />
                )}
                <span>{demoMode ? 'Demo Mode' : 'Live Hardware'}</span>
              </div>
              <button
                onClick={() => setDemoMode(!demoMode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  demoMode
                    ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                    : 'bg-[#EBF7EE] text-[#2E7D32] border-[#C8E6C9] hover:bg-emerald-100'
                }`}
              >
                {demoMode ? t('switch_to_live') : t('switch_to_demo')}
              </button>
            </div>

            {/* Guided Tour / Help */}
            <div className="pt-2 border-t border-[#E2E8DF]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setOpenOnboarding(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-[#556857] hover:text-[#2D3E2F]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Restart Farmer Onboarding Tour</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
