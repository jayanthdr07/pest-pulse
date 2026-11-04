import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CloudSun,
  Sun,
  CloudRain,
  Wind,
  Droplets,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Thermometer,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { WeatherData } from '../types';

import { PageHeader } from '../components/ui/PageHeader';

export const WeatherView: React.FC = () => {
  const { selectedField, t, language } = useApp();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadWeather();
  }, [selectedField?.field_id]);

  const loadWeather = async () => {
    try {
      setLoading(true);
      const data = await api.getWeather(selectedField?.lat, selectedField?.lon, selectedField?.field_id);
      setWeather(data);
    } catch (err) {
      console.error('Weather load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !weather) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-stone-500">Retrieving farm weather station metrics...</p>
        </div>
      </div>
    );
  }

  const isRainRisk = weather.rain_prob_6h >= 60;
  const isWindRisk = weather.wind_max_6h >= 15;
  const isFavorableClimate = weather.temp >= 20 && weather.temp <= 32 && weather.hum >= 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        category="Microclimate & Spray Window Forecast"
        icon={CloudSun}
        title="Farm Weather & Spraying Windows"
        description={
          language === 'kn'
            ? 'ನೈಜ ಸಮಯದ ತಾಪಮಾನ, ತೇವಾಂಶ, ಮಳೆ ಮುನ್ಸೂಚನೆ ಮತ್ತು ಕೃಷಿ ಸಿಂಪಡಣೆಗೆ ಸೂಕ್ತ ಹವಾಮಾನ'
            : 'Precision local microclimate data powered by Open-Meteo and in-field DHT22 hardware telemetry'
        }
      />


      {/* Main Weather Card */}
      <div className="bg-gradient-to-br from-blue-900 via-sky-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold border border-white/15">
              <span>Station: {selectedField?.location_name || 'Hesaraghatta, Bengaluru'}</span>
              <span>•</span>
              <span className="text-sky-300">Lat: {selectedField?.lat || 13.1357}°</span>
            </span>
            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight">{weather.temp}°C</span>
              <div>
                <span className="text-lg font-bold block text-sky-200">
                  {language === 'kn' ? weather.cond_kn : weather.cond}
                </span>
                <span className="text-xs text-sky-300/80">Relative Humidity: {weather.hum}%</span>
              </div>
            </div>
          </div>

          {/* Weather parameters grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
              <span className="text-sky-300 block mb-0.5">{t('wind_speed')}</span>
              <span className="text-base font-extrabold">{weather.wind} km/h</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
              <span className="text-sky-300 block mb-0.5">Rain Fall</span>
              <span className="text-base font-extrabold">{weather.rain_now} mm</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm col-span-2 sm:col-span-1">
              <span className="text-sky-300 block mb-0.5">6h Rain Probability</span>
              <span className="text-base font-extrabold">{weather.rain_prob_6h}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spray Window Agricultural Advisory */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Agricultural Spraying Window Assessment</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            isRainRisk || isWindRisk
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="font-bold flex items-center gap-2 text-sm">
              {isRainRisk || isWindRisk ? (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <span>
                {isRainRisk
                  ? t('spray_postpone_rain')
                  : isWindRisk
                  ? t('spray_postpone_wind')
                  : t('spray_ok')}
              </span>
            </div>
            <p className="leading-relaxed">
              {isRainRisk
                ? 'Rain probability exceeds 60% in the next 6 hours. Spraying now is strictly inadvisable because chemical deposits will be washed off before translaminar absorption.'
                : isWindRisk
                ? 'Peak wind speed exceeds 15 km/h. High spray drift danger to neighboring plots and off-target pollinators. Wait for early morning calm air.'
                : 'Wind is below 15 km/h and no rain is predicted for the next 6 hours. Optimal application window is early morning (6:30 AM - 9:00 AM) or late evening (4:30 PM - 6:30 PM).'}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            isFavorableClimate
              ? 'bg-orange-50 border-orange-200 text-orange-950'
              : 'bg-stone-50 border-stone-200 text-stone-900'
          }`}>
            <div className="font-bold flex items-center gap-2 text-sm">
              <Thermometer className="w-4 h-4 text-orange-600" />
              <span>Pest Proliferation Climate Window</span>
            </div>
            <p className="leading-relaxed">
              {isFavorableClimate
                ? 'Current temperature (20-32°C) and relative humidity (>60%) represent biologically optimal conditions for whitefly, spider mites, and fungal sporulation. Inspect sticky cards daily.'
                : 'Current environmental conditions are outside peak pest reproduction thresholds. Normal monitoring cadence is sufficient.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3-Day Daily Forecast */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
        <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-stone-600" />
          <span>{t('forecast_3day')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {weather.days?.map((d, idx) => (
            <div
              key={d.date}
              className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-stone-900">
                    {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">{d.date}</span>
                </div>

                <div className="text-sm font-extrabold text-stone-900 mb-2">
                  {language === 'kn' ? d.cond_kn : d.cond}
                </div>

                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Max / Min Temp:</span>
                    <span className="font-bold text-stone-800">{d.tmax}° / {d.tmin}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Mean Humidity:</span>
                    <span className="font-semibold">{d.rh}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Rain Probability:</span>
                    <span className={`font-bold ${d.rain_prob > 50 ? 'text-blue-600' : 'text-stone-700'}`}>
                      {d.rain_prob}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
