import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Bug,
  Sun,
  CloudRain,
  Wind,
  Cpu,
  Bell,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Battery,
  BatteryCharging,
  Wifi,
  FileSpreadsheet,
  Box,
  Droplets,
  Clock,
  Radio,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import { api } from '../services/api';

export const HomeView: React.FC = () => {
  const { homeData, selectedField, language, t, demoMode } = useApp();
  const navigate = useNavigate();

  if (!homeData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-600 font-medium">{t('monitoring_status')}...</p>
        </div>
      </div>
    );
  }

  const {
    crop,
    overall,
    weather,
    climate,
    outlook,
    traps,
    total_insects_detected,
    insect_types_count,
    dominant_pest,
    hardware_summary,
    suggestions,
    unread_alerts,
    spray,
  } = homeData;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300',
          dot: 'bg-red-500',
          label: t('status_high_risk'),
          icon: AlertCircle,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: t('status_attention'),
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: t('status_normal'),
          icon: CheckCircle2,
        };
    }
  };

  const riskBadge = getRiskBadge(overall);
  const RiskIcon = riskBadge.icon;

  // Build audio text for suggestions
  const suggestionTextEn = suggestions.map((s) => s.en).join('. ');
  const suggestionTextKn = suggestions.map((s) => s.kn).join('. ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-200 border border-white/10">
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>{selectedField?.name || 'Main Farm Field'}</span>
              <span>•</span>
              <span>{selectedField?.crop_variety || 'Arka Rakshak'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {crop} {t('monitoring_status')}:{' '}
              <span className={`inline-block px-3 py-0.5 rounded-xl text-base font-bold ml-2 border ${riskBadge.bg}`}>
                {riskBadge.label}
              </span>
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              {selectedField?.growth_stage || 'Flowering & Fruit Development Stage'} •{' '}
              {selectedField?.area_acres || 2.5} {t('acres')} •{' '}
              {hardware_summary.online_count} / {hardware_summary.total_devices} {t('connected_traps')} {t('device_online')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/3d-demo')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Box className="w-4 h-4" />
              <span>{t('action_start_3d')}</span>
            </button>
            <button
              onClick={() => navigate('/recommendations')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 backdrop-blur-sm flex items-center gap-2"
            >
              <span>{t('nav_recommendations')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Daily Suggestions Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 hover:border-emerald-200 transition-all">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">{t('card_ai_suggestions')}</h2>
              <p className="text-xs text-stone-500">
                {language === 'kn' ? 'ಹವಾಮಾನ ಮತ್ತು ಕೀಟಗಳ ಎಣಿಕೆ ಆಧಾರಿತ ದೈನಂದಿನ ಸಲಹೆ' : 'Weather & AI count-driven action points'}
              </p>
            </div>
          </div>
          <AudioPlayer textEn={suggestionTextEn} textKn={suggestionTextKn} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                s.tone === 'high'
                  ? 'bg-red-50/70 border-red-200 text-red-950'
                  : s.tone === 'medium'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : s.tone === 'warn'
                  ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {s.tone === 'high' ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : s.tone === 'medium' ? (
                  <Eye className="w-4 h-4 text-amber-600" />
                ) : s.tone === 'warn' ? (
                  <Wifi className="w-4 h-4 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {language === 'kn' ? s.kn : s.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main 5 Dashboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Crop Health */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('card_crop_health')}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${riskBadge.bg}`}>
                {riskBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <Sprout className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-stone-900">{crop}</h3>
                <p className="text-xs text-stone-500">{selectedField?.name || 'Polyhouse Field'}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <div className="flex justify-between">
                <span className="text-stone-500">{t('growth_stage')}:</span>
                <span className="font-semibold text-stone-800">
                  {selectedField?.growth_stage || 'Flowering & Fruiting'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t('acres')}:</span>
                <span className="font-semibold text-stone-800">{selectedField?.area_acres || 2.5} {t('acres')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t('latest_observation')}:</span>
                <span className="font-semibold text-stone-800">
                  {traps[0]?.new !== undefined ? `${traps[0].new} insects` : 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">ICAR Package of Practices</span>
            <button
              onClick={() => navigate('/intelligence')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t('view_details')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Insect Monitoring */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('card_insect_monitoring')}</span>
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('trend_increasing')}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-black text-stone-950">{total_insects_detected}</span>
              <span className="text-xs text-stone-500 font-medium">insects / 24h</span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl space-y-2 text-xs mb-3 border border-stone-100">
              <div className="flex justify-between">
                <span className="text-stone-500">{t('dominant_pest')}:</span>
                <span className="font-bold text-stone-900">
                  {language === 'kn' ? dominant_pest.kn : dominant_pest.en}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t('insect_types')}:</span>
                <span className="font-semibold text-stone-800">{insect_types_count} kinds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t('scientific_name')}:</span>
                <span className="font-mono text-[11px] text-stone-600 italic">{dominant_pest.scientific || 'Bemisia tabaci'}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={() => navigate('/monitoring')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t('nav_monitoring')} (AI Gallery)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => window.open(api.getReportCsvUrl(7, selectedField?.field_id), '_blank')}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
              title={t('action_download_csv')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Card 3: Weather & Spray Window */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('card_weather')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                Open-Meteo
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-3xl font-black text-stone-950">{weather.temp}°C</span>
                <p className="text-xs font-medium text-stone-600 mt-0.5">
                  {language === 'kn' ? weather.cond_kn : weather.cond}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Sun className="w-7 h-7" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-1 text-stone-500">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('humidity')}</span>
                </div>
                <div className="font-bold text-stone-800 mt-0.5">{weather.hum}%</div>
              </div>
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-1 text-stone-500">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  <span>{t('wind_speed')}</span>
                </div>
                <div className="font-bold text-stone-800 mt-0.5">{weather.wind} km/h</div>
              </div>
            </div>

            {/* Spray Window Status */}
            <div className={`p-2.5 rounded-xl border text-xs font-medium ${
              weather.rain_prob_6h >= 60
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : weather.wind_max_6h >= 15
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="font-bold mb-0.5">{t('spray_window')}:</div>
              <div>
                {weather.rain_prob_6h >= 60
                  ? t('spray_postpone_rain')
                  : weather.wind_max_6h >= 15
                  ? t('spray_postpone_wind')
                  : t('spray_ok')}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[11px] text-stone-400">Next 6h Rain: {weather.rain_prob_6h}%</span>
            <button
              onClick={() => navigate('/weather')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t('nav_weather')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4: Hardware Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('card_hardware_status')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                hardware_summary.all_online
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {hardware_summary.all_online ? t('device_online') : t('status_attention')}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-800">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-xl text-stone-900">
                  {hardware_summary.online_count} / {hardware_summary.total_devices}
                </h3>
                <p className="text-xs text-stone-500 font-medium">ESP32-CAM nodes active</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 mb-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-stone-500">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('average_battery')}</span>
                </span>
                <span className="font-bold text-stone-800">{hardware_summary.battery_avg}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-stone-500">
                  <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('solar_status')}</span>
                </span>
                <span className="font-semibold text-emerald-700">{t('active')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-stone-500">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t('last_ping')}</span>
                </span>
                <span className="font-semibold text-stone-800">12 min ago</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[11px] text-stone-400 font-mono">FW: v1.1.0</span>
            <button
              onClick={() => navigate('/devices')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{t('nav_devices')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 5: Alerts & Inspection */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('card_alerts')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
                {unread_alerts} {t('status_attention')}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                <Bell className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-xl text-stone-900">{unread_alerts} Pending</h3>
                <p className="text-xs text-stone-500">Field inspection actions</p>
              </div>
            </div>

            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-xs space-y-1 mb-3">
              <div className="font-bold text-red-950 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>
                  {language === 'kn' ? 'ಬಿಳಿ ನೊಣಗಳ ಸಂಖ್ಯೆ ಹೆಚ್ಚಾಗಿದೆ' : 'Rising Whitefly in Polyhouse North'}
                </span>
              </div>
              <p className="text-red-900/80 text-[11px] leading-relaxed">
                {language === 'kn'
                  ? 'ಕಳೆದ 24 ಗಂಟೆಯಲ್ಲಿ 28 ಕೀಟಗಳು. ಎಲೆ ಮುದುಡು ಲಕ್ಷಣಗಳಿಗೆ ತಪಾಸಣೆ ನಡೆಸಿ.'
                  : '28 catches in 24 h. Scout field for early leaf curling symptoms.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[11px] text-stone-400">Telegram Bot: Ready</span>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1"
            >
              <span>{t('card_alerts')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 6: 3D Demonstration Mode Callout */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-stone-950 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider bg-stone-950 text-amber-300 px-2.5 py-0.5 rounded-full">
                Interactive 3D
              </span>
              <Box className="w-5 h-5 text-stone-950" />
            </div>

            <h3 className="text-lg font-black text-stone-950 mb-1">
              {t('demo_simulation_title')}
            </h3>
            <p className="text-xs text-stone-900 font-medium leading-relaxed mb-4">
              Experience the simulated smart automated spraying rig responding to live pest surges across crop rows.
            </p>

            <div className="bg-stone-950/10 p-2.5 rounded-xl text-[11px] font-bold text-stone-950 border border-stone-950/20 mb-4">
              ⚠️ {t('demo_simulation_badge')}
            </div>
          </div>

          <button
            onClick={() => navigate('/3d-demo')}
            className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>{t('action_start_3d')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
