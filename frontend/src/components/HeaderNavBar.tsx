import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Bell } from 'lucide-react';
import { NAV_GROUPS, NavGroupConfig, NavItemConfig } from '../config/navConfig';
import { useApp } from '../context/AppContext';

export const HeaderNavBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, unreadAlertsCount } = useApp();

  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  // Close dropdown on route change
  useEffect(() => {
    setOpenGroupId(null);
    setFocusedIndex(-1);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setOpenGroupId(null);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Hover intent helpers
  const handleMouseEnter = useCallback((groupId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // 120ms open delay for hover intent
    openTimeoutRef.current = setTimeout(() => {
      setOpenGroupId(groupId);
      setFocusedIndex(-1);
    }, 120);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    // 200ms close delay so diagonal mouse movements don't close the dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setOpenGroupId(null);
      setFocusedIndex(-1);
    }, 200);
  }, []);

  // Keyboard navigation
  const handleTriggerKeyDown = (
    e: React.KeyboardEvent,
    group: NavGroupConfig
  ) => {
    if (group.id === 'overview') return; // direct link

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpenGroupId(group.id);
      setFocusedIndex(0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpenGroupId(null);
      setFocusedIndex(-1);
    }
  };

  const handleMenuKeyDown = (
    e: React.KeyboardEvent,
    items: NavItemConfig[]
  ) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpenGroupId(null);
      setFocusedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedIndex(items.length - 1);
    }
  };

  // Focus management when keyboard indexing changes
  useEffect(() => {
    if (focusedIndex >= 0 && menuItemsRef.current[focusedIndex]) {
      menuItemsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Check if any route in group is active
  const isGroupActive = (group: NavGroupConfig): boolean => {
    if (group.id === 'overview') {
      return location.pathname === '/';
    }
    return group.items.some((item) =>
      item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
    );
  };

  return (
    <nav
      ref={navContainerRef}
      className="hidden lg:block bg-white border-t border-[#E2E8DF] text-[#556857] select-none shadow-[0_1px_3px_rgba(45,62,47,0.03)]"
      aria-label="Main Application Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center gap-1 sm:gap-2 h-12" role="menubar">
          {NAV_GROUPS.map((group) => {
            const hasSubmenu = group.id !== 'overview' && group.items.length > 0;
            const active = isGroupActive(group);
            const isOpen = openGroupId === group.id;
            const GroupIcon = group.icon || (group.items[0]?.icon);

            // Direct link for Home (Overview)
            if (!hasSubmenu) {
              const homeItem = group.items[0];
              const HomeIcon = homeItem.icon;
              return (
                <li key={group.id} role="none" className="h-full flex items-center">
                  <NavLink
                    to={homeItem.to}
                    end
                    role="menuitem"
                    className={({ isActive }) =>
                      `relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32] ${
                        isActive
                          ? 'text-[#2E7D32] font-bold bg-[#EBF7EE] border border-[#C8E6C9]'
                          : 'text-[#556857] hover:text-[#2D3E2F] hover:bg-[#F4F6F3]'
                      }`
                    }
                  >
                    <HomeIcon className={`w-4 h-4 ${active ? 'text-[#2E7D32]' : 'text-[#556857]'}`} />
                    <span>{language === 'kn' ? group.titleKn : group.title}</span>
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#2E7D32] rounded-full" />
                    )}
                  </NavLink>
                </li>
              );
            }

            // Dropdown Menu Groups
            return (
              <li
                key={group.id}
                role="none"
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMouseEnter(group.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Trigger Button */}
                <button
                  type="button"
                  role="menuitem"
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-controls={`dropdown-${group.id}`}
                  onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                  onKeyDown={(e) => handleTriggerKeyDown(e, group)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32] ${
                    active
                      ? 'text-[#2E7D32] font-bold bg-[#EBF7EE] border border-[#C8E6C9]'
                      : isOpen
                      ? 'text-[#2D3E2F] bg-[#F4F6F3]'
                      : 'text-[#556857] hover:text-[#2D3E2F] hover:bg-[#F4F6F3]'
                  }`}
                >
                  {GroupIcon && (
                    <GroupIcon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[#2E7D32]' : 'text-[#556857]'
                      }`}
                    />
                  )}
                  <span className="hidden xl:inline">
                    {language === 'kn' ? group.titleKn : group.title}
                  </span>
                  <span className="xl:hidden">
                    {group.id === 'scan'
                      ? 'Scan'
                      : language === 'kn'
                      ? group.titleKn
                      : group.title}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#556857] transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-[#2E7D32]' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#2E7D32] rounded-full" />
                  )}
                </button>

                {/* Dropdown Menu Panel with invisible hover-bridge */}
                {isOpen && (
                  <div
                    id={`dropdown-${group.id}`}
                    role="menu"
                    aria-label={language === 'kn' ? group.titleKn : group.title}
                    onKeyDown={(e) => handleMenuKeyDown(e, group.items)}
                    className="absolute top-full left-0 z-50 pt-1.5 w-72 sm:w-80 animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none"
                  >
                    {/* Invisible hover bridge to prevent cursor vanishing */}
                    <div className="absolute -top-2 left-0 right-0 h-3" />

                    <div className="bg-white rounded-[18px] border border-[#E2E8DF] p-2 shadow-[0_12px_32px_rgba(45,62,47,0.12)] text-[#2D3E2F] space-y-1">
                      {group.items.map((item, idx) => {
                        const Icon = item.icon;
                        const isCurrent = item.exact
                          ? location.pathname === item.to
                          : location.pathname.startsWith(item.to);

                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            ref={(el) => {
                              menuItemsRef.current[idx] = el;
                            }}
                            role="menuitem"
                            tabIndex={focusedIndex === idx ? 0 : -1}
                            onClick={() => {
                              setOpenGroupId(null);
                              setFocusedIndex(-1);
                            }}
                            className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32] ${
                              isCurrent
                                ? 'bg-[#EBF7EE] text-[#2E7D32] font-semibold border border-[#C8E6C9]'
                                : 'hover:bg-[#F4F6F3] text-[#2D3E2F]'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isCurrent
                                  ? 'bg-[#2E7D32] text-white shadow-xs'
                                  : 'bg-[#F4F6F3] text-[#2E7D32] group-hover:bg-[#EAEFE8]'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    isCurrent ? 'text-[#2E7D32]' : 'text-[#2D3E2F]'
                                  }`}
                                >
                                  {language === 'kn' && item.labelKn ? item.labelKn : item.label}
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
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
                              </div>

                              <p
                                className={`text-[11px] leading-tight line-clamp-1 mt-0.5 ${
                                  isCurrent
                                    ? 'text-[#2E7D32]/80'
                                    : 'text-[#556857]'
                                }`}
                              >
                                {language === 'kn' && item.descriptionKn
                                  ? item.descriptionKn
                                  : item.description}
                              </p>
                            </div>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
