/**
 * PestPulse 2.0 Design Tokens & System Standards
 * Unified styling definitions for cards, buttons, badges, risk levels, and layout spacing.
 */

export const tokens = {
  // Brand color identity
  brand: {
    primary: '#047857',      // emerald-700
    primaryHover: '#065f46', // emerald-800
    primaryLight: '#ecfdf5', // emerald-50
    primaryBorder: '#a7f3d0',// emerald-200
    headerBg: '#064e3b',     // emerald-900
    sidebarBg: '#0f172a',    // slate-900 / stone-900
    surface: '#ffffff',
    background: '#fbfbf8',
  },

  // Risk Level Standard (Never rely on color alone: requires color, background, border, icon, and label)
  risk: {
    low: {
      key: 'low',
      label: 'Low Risk',
      labelKn: 'ಕಡಿಮೆ ಅಪಾಯ',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeBg: 'bg-emerald-600 text-white',
      dot: 'bg-emerald-500',
      border: 'border-emerald-300',
      accent: 'text-emerald-700',
    },
    moderate: {
      key: 'moderate',
      label: 'Moderate Risk',
      labelKn: 'ಮಧ್ಯಮ ಅಪಾಯ',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeBg: 'bg-amber-500 text-stone-950',
      dot: 'bg-amber-500',
      border: 'border-amber-300',
      accent: 'text-amber-700',
    },
    high: {
      key: 'high',
      label: 'High Risk',
      labelKn: 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
      bg: 'bg-red-50 text-red-800 border-red-200',
      badgeBg: 'bg-red-600 text-white',
      dot: 'bg-red-500',
      border: 'border-red-300',
      accent: 'text-red-700',
    },
  },

  // UI Component Styles
  card: 'bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:border-emerald-200/90 transition-all duration-200',
  cardInner: 'p-5 sm:p-6',
  cardHeader: 'flex items-center justify-between pb-4 border-b border-stone-100',
  
  // Standard Button Classes
  button: {
    base: 'inline-flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 min-h-[44px] min-w-[44px] px-4 py-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    primary: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white shadow-sm shadow-emerald-900/10',
    secondary: 'bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 border border-stone-200',
    ghost: 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 active:bg-stone-200',
    outline: 'border border-stone-300 bg-white hover:bg-stone-50 text-stone-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    accent: 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-bold shadow-sm',
  },

  // Standard Badges
  badge: {
    base: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
  },

  // Spacing & Container
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6',
};
