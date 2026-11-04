import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Brain,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sprout,
  Thermometer,
  Droplets,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  Scale,
} from 'lucide-react';
import { api } from '../services/api';

export const IntelligenceView: React.FC = () => {
  const { selectedField, homeData, t, language } = useApp();
  const [adviceData, setAdviceData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAdvice();
  }, [selectedField?.field_id]);

  const loadAdvice = async () => {
    try {
      setLoading(true);
      const data = await api.getSprayAdvice(selectedField?.field_id);
      setAdviceData(data);
    } catch (err) {
      console.error('Failed to load crop intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  const crop = selectedField?.crop_type || 'Tomato';
  const stage = selectedField?.growth_stage || 'Flowering & Early Fruiting';
  const acres = selectedField?.area_acres || 2.5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
          <Brain className="w-6 h-6 text-emerald-600" />
          <span>Crop Intelligence & Action Thresholds</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          {language === 'kn'
            ? 'ಬೆಳೆ-ನಿರ್ದಿಷ್ಟ ಆರ್ಥಿಕ ಹಾನಿ ಮಟ್ಟ (ETL), ಹವಾಮಾನ ಅನುಕೂಲತೆ ಮತ್ತು ವೈಜ್ಞಾನಿಕ ತೀರ್ಮಾನ ವ್ಯವಸ್ಥೆ'
            : 'Crop-specific economic threshold analysis, growth stage vulnerability, and weather factor integration'}
        </p>
      </div>

      {/* Field Intelligence Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            {t('crop')}
          </span>
          <span className="text-xl font-black text-stone-900">{crop}</span>
          <p className="text-xs text-stone-500 mt-1">{selectedField?.crop_variety || 'Arka Rakshak'}</p>
        </div>

        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            {t('growth_stage')}
          </span>
          <span className="text-sm font-extrabold text-emerald-800">{stage}</span>
          <p className="text-xs text-stone-500 mt-1">High flower drop & fruit borer sensitivity</p>
        </div>

        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Plot Area
          </span>
          <span className="text-xl font-black text-stone-900">{acres} {t('acres')}</span>
          <p className="text-xs text-stone-500 mt-1">{selectedField?.name}</p>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
            Threshold Engine
          </span>
          <span className="text-sm font-black text-emerald-950">ICAR-IIHR Calibrated</span>
          <p className="text-[11px] text-emerald-800 mt-1">Multi-pest dynamic thresholds</p>
        </div>
      </div>

      {/* Transparent Disclaimer Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs flex items-start gap-3">
        <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-amber-950">Scientific Transparency Guarantee:</h3>
          <p className="text-amber-900 leading-relaxed">
            PestPulse does not invent generic risk scores. Thresholds below represent actual Economic Threshold Levels (ETL)
            documented by ICAR-IIHR and state agricultural universities. If an unverified pest or crop is encountered, the system displays:
            <em className="font-semibold block mt-0.5 text-amber-950">
              "{t('insufficient_data')}"
            </em>
          </p>
        </div>
      </div>

      {/* Pest-Specific Threshold Analysis Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-stone-900">
          Crop Pests Action Threshold Evaluation
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Evaluating threshold parameters...
          </div>
        ) : (
          <div className="space-y-4">
            {adviceData?.pests?.map((p: any) => {
              const isHigh = p.status === 'spray' || p.status === 'postpone';
              const isMedium = p.status === 'non_chemical' || p.status === 'watch_spray';

              return (
                <div
                  key={p.pest}
                  className={`bg-white rounded-2xl p-6 border shadow-sm transition-all space-y-4 ${
                    isHigh
                      ? 'border-red-300 ring-1 ring-red-200'
                      : isMedium
                      ? 'border-amber-300 ring-1 ring-amber-200'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isHigh ? 'bg-red-100 text-red-700' : isMedium ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isHigh ? <AlertCircle className="w-5 h-5" /> : isMedium ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-stone-900">
                          {language === 'kn' ? p.kn_name : p.en_name}
                        </h3>
                        <p className="text-xs font-mono text-stone-500 italic">{p.latin}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-600">
                        24h Catch: <strong>{p.catches_24h}</strong>
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        isHigh
                          ? 'bg-red-600 text-white'
                          : isMedium
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Decision Reason */}
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-stone-700">Action Assessment & Reason:</div>
                    <p className="text-stone-900 font-medium bg-stone-50 p-3 rounded-xl border border-stone-100 leading-relaxed">
                      {language === 'kn' ? p.reason.kn : p.reason.en}
                    </p>
                  </div>

                  {/* Traps Table */}
                  {p.traps && p.traps.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-400">
                            <th className="py-2">Trap Node</th>
                            <th className="py-2">24h Count</th>
                            <th className="py-2">Medium Threshold</th>
                            <th className="py-2">Action / Spray Threshold</th>
                            <th className="py-2">Risk Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {p.traps.map((tr: any) => (
                            <tr key={tr.node} className="text-stone-800">
                              <td className="py-2 font-bold">{tr.name}</td>
                              <td className="py-2 font-mono font-bold text-emerald-800">{tr.c24}</td>
                              <td className="py-2 text-stone-500">{tr.medium} / 24h</td>
                              <td className="py-2 text-stone-500 font-bold">{tr.high} / 24h</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tr.risk === 'HIGH' ? 'bg-red-100 text-red-800' : tr.risk === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {tr.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Spray window check */}
                  {p.window && (
                    <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      p.window.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}>
                      <div>
                        <strong>Weather Consideration:</strong> {language === 'kn' ? p.window.kn : p.window.en}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
