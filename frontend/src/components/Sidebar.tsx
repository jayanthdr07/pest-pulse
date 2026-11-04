import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { NAV_GROUPS } from '../config/navConfig';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { demoMode, unreadAlertsCount, language } = useApp();
  const location = useLocation();

  return (
    <aside
      className="hidden lg:flex flex-col items-center w-16 bg-stone-900 text-stone-200 border-r border-stone-800 shrink-0 sticky top-0 h-screen select-none z-30 py-3"
      aria-label="Navigation Icon Rail"
    >
      {/* Brand Icon with Tooltip */}
      <div className="relative group mb-3">
        <NavLink
          to="/"
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950 border border-emerald-400/30 transition-transform hover:scale-105"
          aria-label="PestPulse Home"
        >
          <Sprout className="w-6 h-6" />
        </NavLink>
        {/* Tooltip */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-stone-900/95 backdrop-blur-xs text-white text-xs font-bold rounded-lg shadow-xl border border-stone-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          PestPulse 2.0
        </div>
      </div>

      {/* ESP32-CAM LIVE dot indicator (dot only, with tooltip) */}
      <div className="relative group mb-3">
        <div
          className="w-10 h-8 rounded-lg flex items-center justify-center bg-stone-950/40 border border-stone-800/80 cursor-default"
          aria-label={demoMode ? 'Simulated Demo Mode' : 'ESP32-CAM Live Connected'}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                demoMode ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                demoMode ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
        </div>
        {/* Tooltip */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-stone-900/95 backdrop-blur-xs text-xs font-semibold rounded-lg shadow-xl border border-stone-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          <span className={demoMode ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
            {demoMode ? 'Demo Mode' : 'ESP32-CAM Connected (915MHz)'}
          </span>
        </div>
      </div>

      {/* 5 Groups as Icon Rail separated by thin dividers */}
      <div className="flex-1 w-full overflow-y-auto scrollbar-none flex flex-col items-center space-y-1">
        {NAV_GROUPS.map((group, groupIdx) => (
          <React.Fragment key={group.id}>
            {/* Thin Divider between groups */}
            {groupIdx > 0 && <div className="w-8 h-px bg-stone-800 my-2 mx-auto shrink-0" />}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <div key={item.to} className="relative group">
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                        : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/80'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />

                    {/* Small dot pip for badges */}
                    {item.badge === 'Live' && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-stone-900" />
                    )}
                    {item.badge === 'AI' && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-stone-900" />
                    )}
                    {item.badge === 'TTS' && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-stone-900" />
                    )}
                    {item.badge === 'Jitsi' && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-stone-900" />
                    )}
                    {item.showUnreadCount && unreadAlertsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse ring-2 ring-stone-900" />
                    )}
                  </NavLink>

                  {/* Accessible Hover Tooltip with Label & Description */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-stone-900/98 backdrop-blur-md text-stone-100 text-xs rounded-xl shadow-2xl border border-stone-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{language === 'kn' && item.labelKn ? item.labelKn : item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-sm text-white ${
                            item.badgeColor || 'bg-stone-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {language === 'kn' && item.descriptionKn ? item.descriptionKn : item.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Footer Info / Version Tooltip */}
      <div className="relative group mt-auto pt-2 shrink-0">
        <div className="w-9 h-7 rounded-lg bg-stone-950/60 border border-stone-800 text-[10px] font-black text-emerald-400 flex items-center justify-center cursor-default">
          2.0
        </div>
        {/* Tooltip */}
        <div className="absolute left-full ml-3 bottom-0 px-2.5 py-1 bg-stone-900/95 backdrop-blur-xs text-[11px] font-mono text-stone-300 rounded-lg shadow-xl border border-stone-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          PestPulse 2.0 • ICAR-IIHR
        </div>
      </div>
    </aside>
  );
};
