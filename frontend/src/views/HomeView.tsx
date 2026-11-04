import React from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Bug,
  Sun,
  Wind,
  Cpu,
  Bell,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Battery,
  BatteryCharging,
  Wifi,
  FileSpreadsheet,
  Droplets,
  Clock,
  Radio,
  Eye,
  ShieldAlert,
  Mic,
  UploadCloud,
  ChevronRight,
  Gauge,
  Thermometer,
  Layers,
  ScanLine,
} from 'lucide-react';
import { AudioPlayer } from '../components/AudioPlayer';
import { api } from '../services/api';
import { RiskPill } from '../components/ui/RiskPill';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';

export const HomeView: React.FC = () => {
  const { homeData, selectedField, language, t, demoMode } = useApp();
  const navigate = useNavigate();

  if (!homeData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      </div>
    );
  }

  const {
    crop,
    overall,
    weather,
    total_insects_detected,
    dominant_pest,
    hardware_summary,
    suggestions,
    unread_alerts,
  } = homeData;

  // Build audio text for suggestions
  const suggestionTextEn = suggestions?.map((s) => s.en).join('. ') || '';
  const suggestionTextKn = suggestions?.map((s) => s.kn).join('. ') || '';

  // Determine trend indicator vs yesterday
  const isRising = (total_insects_detected || 0) > 25;
  const trendLabel = isRising
    ? t('trend_increasing') || 'Rising vs yesterday (+18%)'
    : t('trend_stable') || 'Stable pest activity';

  // Needle angle for Semi-circular Radial Risk Gauge
  const normRisk = String(overall).toUpperCase();
  const needleAngle =
    normRisk === 'HIGH' || normRisk === 'CRITICAL'
      ? 140
      : normRisk === 'MEDIUM' || normRisk === 'MODERATE'
      ? 90
      : 40;

  return (
    <div className="space-y-6">
      {/* 1. TOP LIVE HARDWARE TELEMETRY STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white text-[#2D3E2F] rounded-[18px] border border-[#E2E8DF] text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
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
          <span className="font-bold text-[#2D3E2F] tracking-wide">
            {demoMode ? 'SIMULATED DEMO ACTIVE' : 'LIVE HARDWARE SYSTEM CONNECTED'}
          </span>
          <span className="text-[#556857]/40 hidden sm:inline">•</span>
          <span className="text-[#556857] hidden sm:inline font-medium">
            {hardware_summary.online_count} of {hardware_summary.total_devices} ESP32-CAM nodes online
          </span>
        </div>

        <div className="flex items-center gap-3 text-[#556857] font-mono text-[11px]">
          <span className="flex items-center gap-1 font-semibold text-[#2E7D32]">
            <Battery className="w-3.5 h-3.5" />
            <span>Avg {hardware_summary.battery_avg}%</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[#556857]">
            <Clock className="w-3.5 h-3.5" />
            <span>Synced 12m ago</span>
          </span>
        </div>
      </div>

      {/* 2. CARD: PEST RISK LEVEL METER (Centerpiece from Mockup 3) */}
      <div className="bg-white rounded-[18px] border border-[#E2E8DF] p-6 sm:p-7 shadow-[0_4px_20px_-2px_rgba(45,62,47,0.06),0_2px_6px_-1px_rgba(45,62,47,0.04)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          {/* Left: Summary Metrics */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7EE] text-xs font-semibold text-[#2E7D32] border border-[#C8E6C9]">
              <Sprout className="w-4 h-4" />
              <span>{selectedField?.name || 'Main Farm Field'}</span>
              <span>•</span>
              <span>{crop} ({selectedField?.crop_variety || 'Arka Rakshak'})</span>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider font-extrabold text-[#556857] mb-1">
                24-Hour Automated Optical Trap Count
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-[#2D3E2F]">
                  {total_insects_detected || 0}
                </span>
                <span className="text-sm sm:text-base text-[#556857] font-medium">
                  total catches across traps
                </span>
                <div className="ml-0 sm:ml-2">
                  <RiskPill level={overall} size="lg" />
                </div>
              </div>
            </div>

            {/* Dominant Pest & Trend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#556857] pt-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F6F3] border border-[#E2E8DF] font-semibold text-[#2D3E2F]">
                {isRising ? (
                  <TrendingUp className="w-4 h-4 text-[#D97746]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#2E7D32]" />
                )}
                <span>{trendLabel}</span>
              </div>
              <div>
                Dominant pest:{' '}
                <strong className="text-[#2D3E2F] font-bold">
                  {language === 'kn' ? dominant_pest.kn : dominant_pest.en}
                </strong>{' '}
                <span className="italic text-[#2E7D32] font-mono text-[11px]">
                  ({dominant_pest.scientific || 'Bemisia tabaci'})
                </span>
              </div>
            </div>
          </div>

          {/* Center: Semi-Circular Radial Pest Risk Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#F4F6F3] rounded-2xl border border-[#E2E8DF]/80 min-w-[240px]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#556857] mb-1 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>Pest Risk Level Meter</span>
            </div>

            {/* SVG Semi-Circle Dial */}
            <div className="relative w-44 h-24 mt-1 flex items-end justify-center">
              <svg viewBox="0 0 160 85" className="w-full h-full overflow-visible">
                {/* Dial Arc Zones */}
                <path
                  d="M 20 80 A 60 60 0 0 1 60 28"
                  fill="none"
                  stroke="#81C784"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 64 25 A 60 60 0 0 1 100 25"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="12"
                />
                <path
                  d="M 104 28 A 60 60 0 0 1 144 80"
                  fill="none"
                  stroke="#D97746"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Needle */}
                <g transform={`rotate(${needleAngle - 90}, 80, 80)`}>
                  <line
                    x1="80"
                    y1="80"
                    x2="80"
                    y2="28"
                    stroke="#2D3E2F"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="80" cy="80" r="5" fill="#2D3E2F" />
                </g>
              </svg>

              {/* Status Pill below needle */}
              <div className="absolute bottom-0 text-center">
                <span className="text-xs font-black text-[#2D3E2F] bg-white px-2.5 py-0.5 rounded-full border border-[#E2E8DF] shadow-2xs">
                  {overall} ALERT
                </span>
              </div>
            </div>

            <div className="flex justify-between w-full px-2 text-[10px] font-semibold text-[#556857] mt-2">
              <span className="text-[#2E7D32]">Low</span>
              <span className="text-amber-600">Moderate</span>
              <span className="text-[#D97746]">High</span>
            </div>
          </div>

          {/* Right: Key Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
            <Button
              variant="accent"
              size="md"
              onClick={() => navigate('/photo-count')}
              icon={<UploadCloud className="w-4 h-4" />}
              className="bg-[#D97746] hover:bg-[#C26535] text-white shadow-xs"
            >
              <span>Scan & Count AI</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/monitoring')}
              icon={<Bug className="w-4 h-4 text-[#2E7D32]" />}
            >
              <span>View Trap Catches</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. ROW: FIELD MICROCLIMATE + OPTIMAL SPRAY WINDOW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Field Microclimate */}
        <Card>
          <CardHeader
            title={t('card_weather') || 'Field Microclimate'}
            subtitle={language === 'kn' ? 'ಮುನ್ಸೂಚನೆ & ತೇವಾಂಶ ಮಟ್ಟ' : 'Live sensor telemetry & Open-Meteo'}
            icon={<Thermometer className="w-5 h-5 text-[#2E7D32]" />}
            action={
              <button
                onClick={() => navigate('/weather')}
                className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('view_details') || 'Details'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-[#2D3E2F] tracking-tight">
                  {weather?.temp || 26.4}°C
                </div>
                <div className="text-xs font-medium text-[#556857] mt-0.5">
                  {language === 'kn' ? weather?.cond_kn : weather?.cond || 'Partly Cloudy'}
                </div>
              </div>
              <div className="text-right text-xs space-y-1.5">
                <div className="flex items-center justify-end gap-1.5 text-[#556857] font-medium">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>Humidity: <strong className="text-[#2D3E2F]">{weather?.hum || 68}%</strong></span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[#556857] font-medium">
                  <Wind className="w-4 h-4 text-[#2E7D32]" />
                  <span>Wind: <strong className="text-[#2D3E2F]">{weather?.wind || 8.2} km/h</strong></span>
                </div>
              </div>
            </div>

            {/* Soil Moisture Horizontal Bar (from Mockup 3) */}
            <div className="p-3 bg-[#F4F6F3] rounded-xl border border-[#E2E8DF] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#2D3E2F]">
                <span>Root Zone Soil Moisture</span>
                <span className="text-[#2E7D32]">Optimal (64%)</span>
              </div>
              <div className="w-full bg-[#E2E8DF] h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-[#81C784] h-full" style={{ width: '64%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-[#556857]">
                <span>Dry</span>
                <span className="font-bold text-[#2E7D32]">Optimal Range</span>
                <span>Saturated</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Optimal Spray Window Forecast */}
        <Card>
          <CardHeader
            title="Optimal Spray Window Forecast"
            subtitle={language === 'kn' ? 'ಸಿಂಪಡಣಾ ಯೋಗ್ಯ ಸಮಯ' : 'Delta-T & wind speed safety assessment'}
            icon={<Sun className="w-5 h-5 text-amber-500" />}
            action={
              <button
                onClick={() => navigate('/weather')}
                className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Forecast</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardContent className="space-y-4">
            {/* Status Pill */}
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                (weather?.rain_prob_6h ?? 0) >= 60
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : (weather?.wind_max_6h ?? 0) >= 15
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-[#EBF7EE] border-[#C8E6C9] text-[#2E7D32]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
                <span className="font-bold">
                  {(weather?.rain_prob_6h ?? 0) >= 60
                    ? 'Postpone (Rain Likely)'
                    : (weather?.wind_max_6h ?? 0) >= 15
                    ? 'Postpone (High Wind)'
                    : 'Favorable: Dry & Calm'}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#C8E6C9]">
                Delta-T: 4.8
              </span>
            </div>

            {/* Timeline Visual Chart for Spray Hours */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-[#556857] flex items-center justify-between">
                <span>Today's Application Timeline</span>
                <span className="text-[#2E7D32] font-semibold">Best: 06:00 - 10:00</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 text-center text-[10px]">
                <div className="p-2 rounded-lg bg-[#EBF7EE] border border-[#C8E6C9] text-[#2E7D32] font-bold">
                  <div>06:00</div>
                  <div className="text-[9px] font-medium text-[#2E7D32]">Good</div>
                </div>
                <div className="p-2 rounded-lg bg-[#EBF7EE] border border-[#C8E6C9] text-[#2E7D32] font-bold">
                  <div>08:00</div>
                  <div className="text-[9px] font-medium text-[#2E7D32]">Optimal</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FEF7EC] border border-[#FDE68A] text-[#B45309] font-bold">
                  <div>12:00</div>
                  <div className="text-[9px] font-medium text-amber-700">Warm</div>
                </div>
                <div className="p-2 rounded-lg bg-[#FEF7EC] border border-[#FDE68A] text-[#B45309] font-bold">
                  <div>14:00</div>
                  <div className="text-[9px] font-medium text-amber-700">Windy</div>
                </div>
                <div className="p-2 rounded-lg bg-[#EBF7EE] border border-[#C8E6C9] text-[#2E7D32] font-bold">
                  <div>16:30</div>
                  <div className="text-[9px] font-medium text-[#2E7D32]">Good</div>
                </div>
                <div className="p-2 rounded-lg bg-[#EBF7EE] border border-[#C8E6C9] text-[#2E7D32] font-bold">
                  <div>18:00</div>
                  <div className="text-[9px] font-medium text-[#2E7D32]">Optimal</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. CARD 4: QUICK CROP DISEASE & PEST DIAGNOSIS (with AI Overlay Preview) */}
      <Card>
        <CardHeader
          title="Quick Crop Disease & Pest Diagnosis"
          subtitle="Real-time optical card capture & YOLOv8 canopy inspection"
          icon={<ScanLine className="w-5 h-5 text-[#2E7D32]" />}
          action={
            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate('/photo-count')}
              className="bg-[#D97746] hover:bg-[#C26535] text-white"
            >
              <span>Scan Canopy</span>
            </Button>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
            {/* Visual Leaf & AI Bounding Box Box */}
            <div className="relative rounded-2xl overflow-hidden border border-[#E2E8DF] bg-stone-900 h-44 flex items-center justify-center group shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80"
                alt="Crop leaf sample"
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
              />
              {/* Simulated AI Detection Overlay Bounding Box */}
              <div className="absolute top-6 left-8 w-24 h-24 border-2 border-[#D97746] rounded-lg shadow-sm flex flex-col justify-between p-1 bg-[#D97746]/10 animate-pulse">
                <span className="text-[9px] font-black bg-[#D97746] text-white px-1 py-0.5 rounded-sm self-start">
                  Whitefly 94%
                </span>
                <span className="text-[8px] font-mono text-white/90 self-end">
                  conf: 0.94
                </span>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-stone-950/80 text-[10px] text-white font-mono">
                ESP32 Trap #1 Snapshot
              </div>
            </div>

            {/* Diagnosis Summary */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#556857]">
                  Active Diagnosis Status
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#2E7D32] border border-[#C8E6C9]">
                  AI Model v2.4 Active
                </span>
              </div>

              <h3 className="text-base font-bold text-[#2D3E2F]">
                Low Infestation • Whitefly (Bemisia tabaci) Detected
              </h3>

              <p className="text-xs text-[#556857] leading-relaxed">
                Automated optical yellow sticky card counting identified early nymph colonies. No severe viral chlorosis symptoms detected in current canopy foliage.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/diseases')}
                  className="bg-[#2E7D32] hover:bg-[#256829] text-white"
                >
                  <span>Disease Reference Library</span>
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => navigate('/recommendations')}
                  className="bg-[#D97746] hover:bg-[#C26535] text-white"
                >
                  <span>Generate Treatment Plan</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. TOP ALERT CARD */}
      <div className="p-5 sm:p-6 bg-[#FFF5F2] border border-[#FCD9CF] rounded-[18px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-[#D97746] flex items-center justify-center shrink-0 border border-red-200">
            <ShieldAlert className="w-5 h-5 text-[#D97746]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#D97746]">
                Priority Field Alert
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-900 font-extrabold">
                {unread_alerts} Pending
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#2D3E2F] mt-0.5">
              {language === 'kn'
                ? 'ಬಿಳಿ ನೊಣಗಳ ಸಂಖ್ಯೆ ಹೆಚ್ಚಾಗಿದೆ - ತಕ್ಷಣ ಜಮೀನು ತಪಾಸಣೆ ನಡೆಸಿ'
                : 'Whitefly Surge Detected in Polyhouse Sector North'}
            </h3>
            <p className="text-xs text-[#556857] mt-1 max-w-2xl leading-relaxed">
              {language === 'kn'
                ? 'ಕಳೆದ 24 ಗಂಟೆಯಲ್ಲಿ 28 ಕೀಟಗಳು ಬಲೆಗೆ ಬಿದ್ದಿವೆ. ಎಲೆ ಮುದುಡು ರೋಗ (TYLCV) ಹರಡುವ ಸಾಧ್ಯತೆಯಿರುವುದರಿಂದ ತಪಾಸಣೆ ನಡೆಸಿ.'
                : 'Catches exceeded action threshold (28 catches/24h). Scout crops for early leaf curl viral transmission symptoms.'}
            </p>
          </div>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => navigate('/alerts')}
          className="shrink-0 bg-[#D97746] hover:bg-[#C26535] text-white"
          icon={<Bell className="w-4 h-4" />}
        >
          <span>Review Alert Checklist</span>
        </Button>
      </div>

      {/* 6. QUICK SHORTCUTS ROW: Voice Agent + Trap Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Quick Voice Agent Button */}
        <div
          onClick={() => navigate('/voice')}
          className="group p-5 bg-white rounded-[18px] border border-[#E2E8DF] hover:border-[#C8E6C9] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-[#2D3E2F]">
                  Voice Agent (ಕನ್ನಡ / English)
                </h4>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                  TTS
                </span>
              </div>
              <p className="text-xs text-[#556857] mt-0.5">
                Ask pest treatments or spray recommendations by voice
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#556857] group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Shortcut to Trap Gallery */}
        <div
          onClick={() => navigate('/trap-gallery')}
          className="group p-5 bg-white rounded-[18px] border border-[#E2E8DF] hover:border-[#C8E6C9] hover:shadow-sm transition-all cursor-pointer flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-[#2D3E2F]">
                  Trap Camera Gallery
                </h4>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#EBF7EE] text-[#2E7D32] border border-[#C8E6C9]">
                  Live
                </span>
              </div>
              <p className="text-xs text-[#556857] mt-0.5">
                Inspect solar sticky optical trap captures in real-time
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#556857] group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 7. AI DAILY SUGGESTIONS CARD (With AudioPlayer) */}
      <Card>
        <CardHeader
          title={t('card_ai_suggestions') || "Today's AI Farming Suggestions"}
          subtitle={
            language === 'kn'
              ? 'ಹವಾಮಾನ ಮತ್ತು ಕೀಟಗಳ ಎಣಿಕೆ ಆಧಾರಿತ ದೈನಂದಿನ ಸಲಹೆ'
              : 'Weather & AI count-driven agronomic action points'
          }
          icon={<Sparkles className="w-5 h-5 text-[#2E7D32]" />}
          action={<AudioPlayer textEn={suggestionTextEn} textKn={suggestionTextKn} />}
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                  s.tone === 'high'
                    ? 'bg-[#FFF5F2] border-[#FCD9CF] text-[#8A2C18]'
                    : s.tone === 'medium'
                    ? 'bg-[#FEF7EC] border-[#FDE68A] text-[#92400E]'
                    : s.tone === 'warn'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-[#EBF7EE] border-[#C8E6C9] text-[#1E5221]'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {s.tone === 'high' ? (
                    <AlertCircle className="w-4 h-4 text-[#D97746]" />
                  ) : s.tone === 'medium' ? (
                    <Eye className="w-4 h-4 text-amber-600" />
                  ) : s.tone === 'warn' ? (
                    <Wifi className="w-4 h-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                  )}
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  {language === 'kn' ? s.kn : s.en}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8DF] flex flex-wrap items-center justify-between gap-3 text-xs text-[#556857]">
            <span>Package of Practices sourced from ICAR-IIHR Hesaraghatta</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open(api.getReportCsvUrl(7, selectedField?.field_id), '_blank')}
                className="text-[#556857] hover:text-[#2D3E2F] flex items-center gap-1 font-semibold cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>Export 7-Day CSV</span>
              </button>
              <button
                onClick={() => navigate('/recommendations')}
                className="text-[#2E7D32] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Fertilizer & Spray Doses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};