import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sprout,
  Sun,
  CloudRain,
  Wifi,
  WifiOff,
  Bell,
  Globe,
  Sliders,
  ChevronDown,
  User,
  FlaskConical,
  Activity,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const {
    farmer,
    fields,
    selectedField,
    setSelectedField,
    language,
    setLanguage,
    t,
    demoMode,
    setDemoMode,
    homeData,
    unreadAlertsCount,
    setOpenOnboarding
  } = useApp();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning');
    if (hour < 17) return t('greeting_afternoon');
    return t('greeting_evening');
  };

  const weather = homeData?.weather;
  const isAllOnline = homeData?.hardware_summary?.all_online ?? true;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 shadow-md border-b border-stone-800">
      {/* Demo Mode / Hardware Banner */}
      <div className={`px-4 py-1 text-xs font-semibold flex items-center justify-between transition-colors ${
        demoMode ? 'bg-amber-500 text-stone-950' : 'bg-emerald-800 text-emerald-100'
      }`}>
        <div className="flex items-center gap-2">
          {demoMode ? (
            <>
              <FlaskConical className="w-3.5 h-3.5" />
              <span>SIMULATED DEMO MODE — Computer-generated trap readings for demonstration.</span>
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
              <span>LIVE HARDWARE MODE — Connected to field ESP32-CAM optical traps & DHT sensors.</span>
            </>
          )}
        </div>
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
            demoMode
              ? 'bg-stone-950 text-amber-300 border-stone-900 hover:bg-stone-900'
              : 'bg-emerald-950 text-emerald-200 border-emerald-700 hover:bg-emerald-900'
          }`}
        >
          {demoMode ? t('switch_to_live') : t('switch_to_demo')}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: Branding & Greeting */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                title="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg border border-emerald-400/30">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                  {t('brand_name')}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700 font-medium">
                  {t('digital_assistant')}
                </span>
              </div>
              <div className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                <span>{getGreeting()}, <strong className="text-stone-200">{farmer?.name || 'Ramesh Kumar'}</strong></span>
                <span>•</span>
                <span>{farmer?.farm_place || 'Hesaraghatta, Bengaluru'}</span>
              </div>
            </div>
          </div>

          {/* Middle: Field & Crop Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedField?.field_id || ''}
                onChange={(e) => {
                  const f = fields.find((item) => item.field_id === e.target.value);
                  setSelectedField(f || null);
                }}
                className="appearance-none bg-stone-800 text-stone-100 pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold border border-stone-700 hover:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {fields.map((f) => (
                  <option key={f.field_id} value={f.field_id}>
                    {f.name} ({f.crop_type} • {f.area_acres} {t('acres')})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedField && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{selectedField.crop_type}</span>
                <span className="text-stone-500">•</span>
                <span>{selectedField.area_acres} {t('acres')}</span>
              </span>
            )}
          </div>

          {/* Right: Telemetry pill, Weather pill, Bell, Language */}
          <div className="flex items-center gap-2.5 self-end md:self-center">
            {/* Weather status pill */}
            {weather && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/80 border border-stone-700 text-xs text-stone-300">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{weather.temp}°C</span>
                <span className="text-stone-500">•</span>
                <span>{weather.hum}% RH</span>
              </div>
            )}

            {/* Hardware connectivity pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isAllOnline
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/70 border-amber-800 text-amber-300'
            }`}>
              {isAllOnline ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              )}
              <span className="hidden sm:inline">{isAllOnline ? t('all_devices_online') : t('device_alert')}</span>
            </div>

            {/* Alerts Bell */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              title={t('card_alerts')}
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2 py-1 rounded text-xs font-bold font-kannada transition-all ${
                  language === 'kn'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Farmer Profile / Logout */}
            <button
              onClick={() => setOpenOnboarding(true)}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
              title="Farmer Profile & Onboarding"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
