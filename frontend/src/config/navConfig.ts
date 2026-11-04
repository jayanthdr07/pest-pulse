import {
  Home,
  Camera,
  Bug,
  LineChart,
  Cpu,
  UploadCloud,
  HeartPulse,
  ShieldCheck,
  Bell,
  Brain,
  Mic,
  Video,
  LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  to: string;
  label: string;
  labelKn?: string;
  description: string;
  descriptionKn?: string;
  icon: LucideIcon;
  badge?: 'Live' | 'AI' | 'TTS' | 'Jitsi' | string;
  badgeColor?: string;
  exact?: boolean;
  showUnreadCount?: boolean;
}

export interface NavGroupConfig {
  id: 'overview' | 'monitor' | 'scan' | 'act' | 'help';
  title: string;
  titleKn: string;
  icon?: LucideIcon;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'overview',
    title: 'Home',
    titleKn: 'ಮುಖಪುಟ',
    items: [
      {
        to: '/',
        label: 'Home',
        labelKn: 'ಮುಖಪುಟ',
        description: 'Live dashboard: pest count, risk level & weather',
        descriptionKn: 'ಲೈವ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್: ಕೀಟಗಳ ಸಂಖ್ಯೆ ಮತ್ತು ಹವಾಮಾನ',
        icon: Home,
        exact: true,
      },
    ],
  },
  {
    id: 'monitor',
    title: 'Monitor',
    titleKn: 'ಕಣ್ಗಾವಲು',
    icon: Camera,
    items: [
      {
        to: '/trap-gallery',
        label: 'Trap Camera Gallery',
        labelKn: 'ಬಲೆ ಕ್ಯಾಮೆರಾ ಗ್ಯಾಲರಿ',
        description: 'Live field photos from ESP32-CAM solar optical traps',
        descriptionKn: 'ಸೌರ ಆಪ್ಟಿಕಲ್ ಬಲೆಗಳಿಂದ ನೇರ ಫೋಟೋಗಳು',
        icon: Camera,
        badge: 'Live',
        badgeColor: 'bg-blue-600',
      },
      {
        to: '/monitoring',
        label: 'Insect Monitoring',
        labelKn: 'ಕೀಟಗಳ ಕಣ್ಗಾವಲು',
        description: 'Species classification and daily catch statistics',
        descriptionKn: 'ಕೀಟಗಳ ವರ್ಗೀಕರಣ ಮತ್ತು ದೈನಂದಿನ ಅಂಕಿಅಂಶಗಳು',
        icon: Bug,
      },
      {
        to: '/trends',
        label: 'Historical Trends',
        labelKn: 'ಐತಿಹಾಸಿಕ ಪ್ರವೃತ್ತಿಗಳು',
        description: 'Multi-day pest population curves & weather correlation',
        descriptionKn: 'ದೀರ್ಘಾವಧಿಯ ಕೀಟಗಳ ಪ್ರವೃತ್ತಿ ಮತ್ತು ಹವಾಮಾನ',
        icon: LineChart,
      },
      {
        to: '/devices',
        label: 'Devices',
        labelKn: 'ಉಪಕರಣಗಳು',
        description: 'ESP32-CAM hardware nodes, battery levels & sync',
        descriptionKn: 'ಹಾರ್ಡ್‌ವೇರ್ ಸ್ಥಿತಿ, ಬ್ಯಾಟರಿ ಮತ್ತು ಸಂಪರ್ಕ',
        icon: Cpu,
      },
    ],
  },
  {
    id: 'scan',
    title: 'Scan & Diagnose',
    titleKn: 'ಸ್ಕ್ಯಾನ್ & ಪತ್ತೆ',
    icon: UploadCloud,
    items: [
      {
        to: '/photo-count',
        label: 'Photo Upload & Count',
        labelKn: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ & ಎಣಿಕೆ',
        description: 'Automated AI insect detection and count on sticky cards',
        descriptionKn: 'ಎಐ ಮೂಲಕ ಸ್ವಯಂಚಾಲಿತ ಕೀಟಗಳ ಎಣಿಕೆ',
        icon: UploadCloud,
        badge: 'AI',
        badgeColor: 'bg-purple-600',
      },
      {
        to: '/diseases',
        label: 'Crop Diseases',
        labelKn: 'ಬೆಳೆ ರೋಗಗಳು',
        description: 'Visual symptom diagnosis library for foliar infections',
        descriptionKn: 'ಎಲೆ ಮತ್ತು ಸಸ್ಯ ರೋಗಗಳ ಲಕ್ಷಣ ಮಾರ್ಗದರ್ಶಿ',
        icon: HeartPulse,
      },
    ],
  },
  {
    id: 'act',
    title: 'Act',
    titleKn: 'ಕ್ರಮಗಳು',
    icon: ShieldCheck,
    items: [
      {
        to: '/recommendations',
        label: 'Recommendations',
        labelKn: 'ಶಿಫಾರಸುಗಳು',
        description: 'ICAR-IIHR approved chemical and biological spray schedules',
        descriptionKn: 'ಕೃಷಿ ತಜ್ಞರ ಸಿಂಪಡಣಾ ಮತ್ತು ರಕ್ಷಣಾ ಸಲಹೆಗಳು',
        icon: ShieldCheck,
      },
      {
        to: '/alerts',
        label: 'Alerts',
        labelKn: 'ಎಚ್ಚರಿಕೆಗಳು',
        description: 'Threshold warnings and critical pest outbreak sirens',
        descriptionKn: 'ತುರ್ತು ಕೀಟ ಬಾಧೆ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಪ್ರಕಟಣೆಗಳು',
        icon: Bell,
        showUnreadCount: true,
      },
      {
        to: '/intelligence',
        label: 'Crop Intelligence',
        labelKn: 'ಬೆಳೆ ಬುದ್ಧಿಮತ್ತೆ',
        description: 'Growing degree-day modeling and pest risk forecasts',
        descriptionKn: 'ಮುನ್ಸೂಚನೆ ಮಾದರಿ ಮತ್ತು ಅಪಾಯದ ಮುನ್ಸೂಚನೆ',
        icon: Brain,
      },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    titleKn: 'ಸಹಾಯ',
    icon: Mic,
    items: [
      {
        to: '/voice',
        label: 'Voice Agent',
        labelKn: 'ಧ್ವನಿ ಸಹಾಯಕ',
        description: 'Spoken interactive assistant in Kannada and English',
        descriptionKn: 'ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಧ್ವನಿ ಸಹಾಯಕ',
        icon: Mic,
        badge: 'TTS',
        badgeColor: 'bg-amber-600',
      },
      {
        to: '/consultation',
        label: 'Expert Consultation',
        labelKn: 'ತಜ್ಞರ ಸಂಪರ್ಕ',
        description: 'Schedule a live Jitsi video appointment with an entomologist',
        descriptionKn: 'ಕೃಷಿ ವಿಜ್ಞಾನಿಗಳೊಂದಿಗೆ ವೀಡಿಯೊ ಸಮಾಲೋಚನೆ',
        icon: Video,
        badge: 'Jitsi',
        badgeColor: 'bg-teal-600',
      },
    ],
  },
];

