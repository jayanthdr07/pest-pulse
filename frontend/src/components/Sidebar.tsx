import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Home,
  QrCode,
  Video,
  Mic,
  Camera,
  UploadCloud,
  Layers,
  Bug,
  LineChart,
  Brain,
  CloudSun,
  ShieldCheck,
  HeartPulse,
  Cpu,
  Bell,
  Box,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Radio,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: any;
  exact?: boolean;
  badge?: string;
  badgeColor?: string;
  count?: number;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const { t, language, setLanguage, demoMode, fields, selectedField, setSelectedField, unreadAlertsCount } = useApp();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const location = useLocation();

  const navigationSections: NavSection[] = [
    {
      title: language === 'kn' ? 'ಮುಖ್ಯ ನಿಗಾ & ಬೆಳೆ' : 'Monitoring & Crops',
      items: [
        { to: '/', label: t('nav_home'), icon: Home, exact: true },
        { to: '/passport', label: t('nav_passport'), icon: QrCode, badge: 'QR', badgeColor: 'bg-emerald-500' },
        { to: '/trap-gallery', label: t('nav_trap_gallery'), icon: Camera, badge: 'Live', badgeColor: 'bg-blue-500' },
        { to: '/photo-count', label: t('nav_photo_count'), icon: UploadCloud, badge: 'AI', badgeColor: 'bg-purple-500' },
        { to: '/fields', label: t('nav_fields'), icon: Layers },
        { to: '/monitoring', label: t('nav_monitoring'), icon: Bug },
        { to: '/trends', label: t('nav_trends'), icon: LineChart },
        { to: '/intelligence', label: t('nav_intelligence'), icon: Brain },
      ],
    },
    {
      title: language === 'kn' ? 'ತಜ್ಞರು & ಕೃಷಿ ಕ್ರಮಗಳು' : 'Expert & Interventions',
      items: [
        { to: '/consultation', label: t('nav_consultation'), icon: Video, badge: 'Jitsi', badgeColor: 'bg-teal-500' },
        { to: '/voice', label: t('nav_voice'), icon: Mic, badge: 'TTS', badgeColor: 'bg-amber-500' },
        { to: '/weather', label: t('nav_weather'), icon: CloudSun },
        { to: '/recommendations', label: t('nav_recommendations'), icon: ShieldCheck },
        { to: '/diseases', label: t('nav_diseases'), icon: HeartPulse },
      ],
    },
    {
      title: language === 'kn' ? 'ಸಾಧನ & ಸೆಟ್ಟಿಂಗ್ಸ್' : 'Hardware & System',
      items: [
        { to: '/devices', label: t('nav_devices'), icon: Cpu },
        { to: '/alerts', label: t('nav_alerts'), icon: Bell, count: unreadAlertsCount },
        { to: '/3d-demo', label: t('nav_3d_demo'), icon: Box, highlight: true },
        { to: '/settings', label: t('nav_settings'), icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-stone-900 text-stone-200 border-r border-stone-800 transition-all duration-300 shadow-2xl lg:static lg:shadow-none ${
          collapsed ? 'w-20' : 'w-72'
        } ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-800 bg-stone-950/40">
          <NavLink to="/" onClick={onCloseMobile} className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 shrink-0">
              <Bug className="w-6 h-6 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="leading-tight truncate">
                <div className="flex items-center gap-1.5 font-black text-white text-base tracking-tight">
                  <span>PestPulse</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    2.0
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 truncate">
                  {language === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್' : 'Smart Agriculture Platform'}
                </p>
              </div>
            )}
          </NavLink>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Field Selector */}
        {!collapsed && fields && fields.length > 0 && (
          <div className="px-3 py-3 border-b border-stone-800 bg-stone-950/20">
            <label className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1 mb-1.5">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{language === 'kn' ? 'ಆಯ್ಕೆಮಾಡಿದ ಜಮೀನು' : 'Active Monitored Field'}</span>
            </label>
            <select
              value={selectedField?.field_id || ''}
              onChange={(e) => {
                const found = fields.find((f) => f.field_id === e.target.value);
                if (found) setSelectedField(found);
              }}
              className="w-full text-xs bg-stone-800 text-stone-200 border border-stone-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium truncate"
            >
              {fields.map((f) => (
                <option key={f.field_id} value={f.field_id}>
                  {f.name} ({f.crop_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Live Hardware Status Indicator */}
        <div className={`px-4 py-2 border-b border-stone-800 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${demoMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${demoMode ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            {!collapsed && (
              <span className="text-[11px] font-semibold tracking-wide text-stone-300">
                {demoMode ? 'SIMULATED DEMO' : 'LIVE HARDWARE IOT'}
              </span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
              <Radio className="w-3 h-3 text-emerald-400" />
              ESP32-CAM
            </span>
          )}
        </div>

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-stone-800">
          {navigationSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? item.highlight
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-800/40'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                        : item.highlight
                        ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/50'
                        : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-stone-400 group-hover:text-stone-200'
                      }`}
                    />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between truncate">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`ml-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-white ${
                              item.badgeColor || 'bg-stone-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.count !== undefined && item.count > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-extrabold animate-pulse">
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer & Language Pill */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/40 space-y-2">
          {!collapsed ? (
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="text-[11px] font-medium">{language === 'kn' ? 'ಭಾಷೆ:' : 'Language:'}</span>
              <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded-lg border border-stone-700">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    language === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('kn')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    language === 'kn' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  ಕನ್ನಡ
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
              className="w-full py-1 text-center text-[10px] font-bold bg-stone-800 rounded text-emerald-400 hover:bg-stone-700"
              title="Toggle Language"
            >
              {language.toUpperCase()}
            </button>
          )}

          {!collapsed && (
            <div className="text-[10px] text-stone-500 text-center font-mono pt-1">
              PestPulse v2.0 • ICAR-IIHR
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
