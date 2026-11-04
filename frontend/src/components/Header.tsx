import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ProfileMenu } from './ProfileMenu';
import { HeaderNavBar } from './HeaderNavBar';
import {
  Sprout,
  Sun,
  Bell,
  ChevronDown,
  MapPin,
  X,
  FlaskConical,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileDrawer }) => {
  const {
    farmer,
    fields,
    selectedField,
    setSelectedField,
    demoMode,
    setDemoMode,
    homeData,
    unreadAlertsCount,
    t,
  } = useApp();
  const navigate = useNavigate();
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning') || 'Good morning';
    if (hour < 17) return t('greeting_afternoon') || 'Good afternoon';
    return t('greeting_evening') || 'Good evening';
  };

  const weather = homeData?.weather;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-[#2D3E2F] border-b border-[#E2E8DF] shadow-[0_2px_12px_rgba(45,62,47,0.04)]">
      {/* Slim dismissible Live Hardware / Demo strip */}
      {!bannerDismissed && (
        <div
          className={`px-3 sm:px-4 py-1 text-xs font-semibold flex items-center justify-between transition-colors ${
            demoMode
              ? 'bg-amber-100 text-amber-900 border-b border-amber-200'
              : 'bg-[#EBF7EE] text-[#2E7D32] border-b border-[#C8E6C9]'
          }`}
        >
          <div className="flex items-center gap-2 truncate text-[11px] sm:text-xs font-medium">
            {demoMode ? (
              <>
                <FlaskConical className="w-3.5 h-3.5 shrink-0 text-amber-800" />
                <span className="truncate">
                  Simulated Demo Mode — Simulated pest counts and weather alerts.
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                </span>
                <span className="truncate">
                  Live Hardware Mode — Active telemetry connected to field ESP32-CAM optical traps & DHT sensors.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                demoMode
                  ? 'bg-amber-900 text-amber-100 hover:bg-amber-800'
                  : 'bg-white text-[#2E7D32] border border-[#C8E6C9] hover:bg-[#EBF7EE]'
              }`}
            >
              {demoMode ? (t('switch_to_live') || 'Switch to Live') : (t('switch_to_demo') || 'Switch to Demo')}
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-0.5 rounded text-[#556857] hover:text-[#2D3E2F]"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Logo & Title + Active Monitored Field Selector */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Trigger (<1024px) */}
            <button
              type="button"
              onClick={onOpenMobileDrawer}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] rounded-xl bg-[#F4F6F3] hover:bg-[#EAEFE8] text-[#556857] hover:text-[#2D3E2F] flex items-center justify-center cursor-pointer border border-[#E2E8DF] shrink-0 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo & Title (shown on all screens) */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer shrink-0 select-none group mr-1 sm:mr-2"
              title="PestPulse 2.0 Home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2E7D32] to-[#2D3E2F] flex items-center justify-center text-white shadow-xs border border-emerald-400/20 group-hover:scale-105 transition-transform shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="font-black text-[#2D3E2F] text-base tracking-tight leading-none">
                  PestPulse
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EBF7EE] text-[#2E7D32] font-extrabold border border-[#C8E6C9]">
                  2.0
                </span>
              </div>
            </div>

            {/* Field Dropdown Selector (Sticky & Prominent) */}
            {fields && fields.length > 0 && (
              <div className="relative flex items-center min-w-0">
                <label htmlFor="active-field-select" className="sr-only">
                  Active Monitored Field
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#2E7D32]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <select
                    id="active-field-select"
                    value={selectedField?.field_id || ''}
                    onChange={(e) => {
                      const found = fields.find((f) => f.field_id === e.target.value);
                      if (found) setSelectedField(found);
                    }}
                    className="appearance-none bg-[#F4F6F3] hover:bg-[#EAEFE8] text-[#2D3E2F] pl-8.5 pr-8 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold border border-[#E2E8DF] focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32] cursor-pointer max-w-[200px] sm:max-w-xs md:max-w-sm truncate shadow-2xs transition-colors"
                  >
                    {fields.map((f) => (
                      <option key={f.field_id} value={f.field_id}>
                        {f.name} ({f.crop_type} • {f.area_acres} {t('acres') || 'acres'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#556857] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Desktop Greeting pill */}
                <div className="hidden xl:flex items-center gap-1 text-xs text-[#556857] ml-3 truncate">
                  <span>{getGreeting()},</span>
                  <strong className="text-[#2D3E2F]">{farmer?.name || 'Ramesh Kumar'}</strong>
                  <span className="text-stone-300">•</span>
                  <span className="text-[#556857]">{farmer?.farm_place || 'Hesaraghatta, Bengaluru'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Status Pill, Weather Mini, Alerts Bell, Profile Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* LIVE status pill (pulsing green dot, "ESP32-CAM connected") */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-bold border transition-colors shadow-2xs ${
                demoMode
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-[#EBF7EE] border-[#C8E6C9] text-[#2E7D32]'
              }`}
              title={
                demoMode
                  ? 'Simulated Mode Active'
                  : 'ESP32-CAM Solar Optical Traps & DHT Telemetry Connected'
              }
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    demoMode ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    demoMode ? 'bg-amber-500' : 'bg-[#2E7D32]'
                  }`}
                />
              </span>
              <span className="hidden sm:inline">
                {demoMode ? 'Demo Traps' : 'ESP32-CAM connected'}
              </span>
              <span className="sm:hidden text-[11px]">
                {demoMode ? 'Demo' : 'LIVE'}
              </span>
            </div>

            {/* Mini Weather summary pill on tablet/desktop */}
            {weather && (
              <div
                onClick={() => navigate('/weather')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 min-h-[40px] rounded-xl bg-[#F4F6F3] hover:bg-[#EAEFE8] border border-[#E2E8DF] text-xs text-[#2D3E2F] transition-colors cursor-pointer"
                title="View Farm Weather Details"
              >
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold">{weather.temp}°C</span>
                <span className="text-[#556857]/60">•</span>
                <span className="text-[#556857]">{weather.hum}% RH</span>
              </div>
            )}

            {/* Notification Bell (with unread badge in terracotta) */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-[#F4F6F3] hover:bg-[#EAEFE8] border border-[#E2E8DF] text-[#556857] hover:text-[#2D3E2F] transition-colors flex items-center justify-center cursor-pointer"
              title="Alerts Center"
              aria-label="Alerts Center"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#D97746] text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-xs">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Farmer Profile Avatar Dropdown Menu */}
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* New Horizontal Navigation Bar directly under the top bar */}
      <HeaderNavBar />
    </header>
  );
};
