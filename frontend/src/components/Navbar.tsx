import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Home,
  Layers,
  Bug,
  Brain,
  CloudSun,
  ShieldCheck,
  Cpu,
  Bell,
  Box,
  HeartPulse,
  Settings,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, unreadAlertsCount } = useApp();

  const links = [
    { to: '/', label: t('nav_home'), icon: Home },
    { to: '/fields', label: t('nav_fields'), icon: Layers },
    { to: '/monitoring', label: t('nav_monitoring'), icon: Bug },
    { to: '/intelligence', label: t('nav_intelligence'), icon: Brain },
    { to: '/weather', label: t('nav_weather'), icon: CloudSun },
    { to: '/recommendations', label: t('nav_recommendations'), icon: ShieldCheck },
    { to: '/diseases', label: t('nav_diseases'), icon: HeartPulse },
    { to: '/devices', label: t('nav_devices'), icon: Cpu },
    { to: '/alerts', label: t('nav_alerts'), icon: Bell, badge: unreadAlertsCount },
    { to: '/3d-demo', label: t('nav_3d_demo'), icon: Box, highlight: true },
    { to: '/settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-stone-200 shadow-sm sticky top-[61px] z-30 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? link.highlight
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm font-bold'
                      : link.highlight
                      ? 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200/80 border border-emerald-300'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
