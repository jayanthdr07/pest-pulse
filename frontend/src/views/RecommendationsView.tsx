import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Sprout,
  Droplets,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Scale,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { FertilizerPlan, SprayRecord } from '../types';

export const RecommendationsView: React.FC = () => {
  const { selectedField, t, language } = useApp();
  const [activeTab, setActiveTab] = useState<'fertilizer' | 'pesticide' | 'spray_log'>('fertilizer');
  const [fertilizerPlan, setFertilizerPlan] = useState<FertilizerPlan | null>(null);
  const [sprayAdvice, setSprayAdvice] = useState<any>(null);
  const [sprayLogs, setSprayLogs] = useState<SprayRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Spray Log Modal
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logPest, setLogPest] = useState('whitefly');
  const [logProduct, setLogProduct] = useState('Imidacloprid 17.8 SL');
  const [logDose, setLogDose] = useState('0.3 ml/L (60 ml/acre)');
  const [logPhi, setLogPhi] = useState('5');
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    loadAll();
  }, [selectedField?.field_id]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const crop = selectedField?.crop_type || 'Tomato';
      const acres = selectedField?.area_acres || 2.5;

      const [fert, advice, logs] = await Promise.all([
        api.getFertilizers(crop, acres, selectedField?.field_id),
        api.getSprayAdvice(selectedField?.field_id),
        api.getSprays(120, selectedField?.field_id),
      ]);

      setFertilizerPlan(fert);
      setSprayAdvice(advice);
      setSprayLogs(logs);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpray = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addSpray({
      field_id: selectedField?.field_id || 'field_001',
      pest: logPest,
      product: logProduct,
      dose: logDose,
      area_acres: selectedField?.area_acres || 2.5,
      phi_days: parseInt(logPhi) || 3,
      notes: logNotes,
      by_name: 'Farmer',
    });
    setShowLogModal(false);
    await loadAll();
  };

  const handleDeleteSpray = async (id: number) => {
    if (confirm('Delete this spray entry?')) {
      await api.deleteSpray(id);
      await loadAll();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>{t('nav_recommendations')}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {language === 'kn'
              ? 'ಪೌಷ್ಟಿಕಾಂಶ ಗೊಬ್ಬರ ಮತ್ತು ಕೀಟ ನಿಯಂತ್ರಣ ಔಷಧಗಳ ಸ್ಪಷ್ಟ ವೈಜ್ಞಾನಿಕ ಮಾರ್ಗದರ್ಶಿ'
              : 'Verified agronomic nutrient doses and scientifically established IPM pest interventions'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('fertilizer')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'fertilizer'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>{t('tab_fertilizer')}</span>
          </button>
          <button
            onClick={() => setActiveTab('pesticide')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'pesticide'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('tab_pesticide')}</span>
          </button>
          <button
            onClick={() => setActiveTab('spray_log')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'spray_log'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('tab_spray_log')}</span>
          </button>
        </div>
      </div>

      {/* Critical Scientific Safety Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs flex items-start gap-3">
        <Scale className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-emerald-950">Nutrient versus Pesticide Principle:</h3>
          <p className="text-emerald-900 leading-relaxed">
            {t('fertilizer_vs_pesticide_notice')}
          </p>
        </div>
      </div>

      {/* TAB 1: FERTILIZER & PLANT NUTRIENTS */}
      {activeTab === 'fertilizer' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Package of Practices for {fertilizerPlan?.crop || 'Tomato'}
              </h2>
              <p className="text-xs text-stone-500">
                Source: {fertilizerPlan?.citation || 'ICAR-IIHR Hesaraghatta Bengaluru'}
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-bold text-stone-800">
              Field Area: {selectedField?.area_acres || 2.5} {t('acres')}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-stone-500">Computing acreage nutrition schedules...</div>
          ) : (
            <div className="space-y-6">
              {fertilizerPlan?.stages?.map((stage) => (
                <div
                  key={stage.stage_id}
                  className={`bg-white rounded-2xl border shadow-sm p-6 space-y-4 ${
                    stage.is_current_stage
                      ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-stone-900">
                          {language === 'kn' ? stage.stage_kn : stage.stage}
                        </h3>
                        {stage.is_current_stage && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                            Current Stage
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {language === 'kn' ? stage.purpose_kn : stage.purpose}
                      </p>
                    </div>
                  </div>

                  {/* Nutrients Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-400">
                          <th className="py-2.5">Nutrient / Fertilizer</th>
                          <th className="py-2.5">Category</th>
                          <th className="py-2.5">{t('rate_per_acre')}</th>
                          <th className="py-2.5 font-bold text-emerald-800">{t('total_needed')}</th>
                          <th className="py-2.5">Application Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {stage.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-stone-50 transition-colors">
                            <td className="py-3 font-bold text-stone-900 pr-3">
                              {language === 'kn' ? item.nutrient_kn : item.nutrient}
                              {item.precautions && (
                                <p className="text-[10px] font-normal text-stone-500 mt-0.5">
                                  {item.precautions}
                                </p>
                              )}
                            </td>
                            <td className="py-3 text-stone-500 pr-3">{item.category}</td>
                            <td className="py-3 text-stone-600 font-mono pr-3">
                              {item.verified_rate_per_acre}
                            </td>
                            <td className="py-3 font-extrabold text-emerald-800 text-sm pr-3">
                              {item.calculated_total_quantity}
                            </td>
                            <td className="py-3 text-stone-600 pr-3">
                              {language === 'kn' ? item.application_method_kn : item.application_method}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[11px] text-stone-400 border-t border-stone-100">
                    <span>Spray water volume: 200 L per acre</span>
                    <span>Reviewed: {stage.items[0]?.reviewed_date || '2026-10-15'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PEST CONTROL & IPM INTERVENTIONS */}
      {activeTab === 'pesticide' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Pest Interventions & Resistance Management (IRAC)
              </h2>
              <p className="text-xs text-stone-500">
                Enforcing non-chemical biological measures first, and insecticide mode-of-action rotation
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
              Min 10-Day Spray Interval
            </span>
          </div>

          <div className="space-y-6">
            {sprayAdvice?.pests?.map((p: any) => (
              <div
                key={p.pest}
                className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-base font-extrabold text-stone-900">
                      {language === 'kn' ? p.kn_name : p.en_name}
                    </h3>
                    <p className="text-xs text-stone-500 font-mono italic">{p.latin}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-stone-100 text-stone-800 border">
                    Status: {p.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Status Explanation */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-900 font-medium">
                  <strong>Assessment:</strong> {language === 'kn' ? p.reason.kn : p.reason.en}
                </div>

                {/* Non-Chemical IPM First */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t('non_chemical_first')}</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {p.non_chemical?.map((step: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-950 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{language === 'kn' ? step.kn : step.en}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chemical Options */}
                {p.chemical && p.chemical.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between text-xs">
                      <h4 className="font-extrabold text-stone-900">
                        Sourced Chemical Options (Calculated for {selectedField?.area_acres || 2.5} acres)
                      </h4>
                      <span className="text-[11px] text-stone-400">Assuming 200 L water / acre</span>
                    </div>

                    <div className="space-y-2">
                      {p.chemical.map((chem: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            chem.suggested
                              ? 'bg-emerald-50/80 border-emerald-300'
                              : chem.same_group_as_last
                              ? 'bg-red-50/60 border-red-200 opacity-75'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-stone-900">{chem.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                                IRAC {chem.irac}
                              </span>
                              {chem.suggested && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">
                                  Suggested Next
                                </span>
                              )}
                              {chem.same_group_as_last && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                  Repeat Group Warning
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5">
                              Trade: {chem.trade} • Waiting Period (PHI): <strong>{chem.phi_days} days</strong>
                            </div>
                            {chem.note && <p className="text-[10px] text-amber-700 mt-0.5">{chem.note}</p>}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-black text-emerald-800 text-sm">
                              {chem.per_l} {chem.unit} / L water
                            </div>
                            <div className="text-[11px] text-stone-600">
                              Total needed: <strong>{round(chem.per_acre * (selectedField?.area_acres || 2.5))} {chem.unit}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SPRAY LOG & HARVEST SAFETY */}
      {activeTab === 'spray_log' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Spray Log, Pre-Harvest Intervals & Residue Protection
              </h2>
              <p className="text-xs text-stone-500">
                Track applied treatments, statutory waiting days before harvest, and insect catch suppression
              </p>
            </div>
            <button
              onClick={() => setShowLogModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Log a Spray Application</span>
            </button>
          </div>

          <div className="space-y-4">
            {sprayLogs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 text-xs text-stone-500">
                No spray applications recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sprayLogs.map((log) => {
                  const sprayDate = new Date(log.ts * 1000).toLocaleDateString();
                  const safeDate = log.safe_harvest_ts
                    ? new Date(log.safe_harvest_ts * 1000).toLocaleDateString()
                    : null;
                  const isSafeNow = log.safe_harvest_ts ? Date.now() >= log.safe_harvest_ts * 1000 : true;

                  return (
                    <div
                      key={log.id}
                      className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-stone-900">{log.product}</span>
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-stone-100 text-stone-700">
                            IRAC {log.irac}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Target: {log.pest_en || log.pest}
                          </span>
                        </div>
                        <p className="text-stone-500 text-[11px]">
                          Sprayed on: <strong>{sprayDate}</strong> • Dose: {log.dose} • Area: {log.area_acres} acres
                        </p>
                        {log.notes && <p className="text-[11px] text-stone-600 italic">Notes: {log.notes}</p>}
                        {log.effect && (
                          <p className="text-emerald-700 font-bold text-[11px] pt-1">
                            Catch reduction: {log.effect.change_pct}% 3 days post-spray ({log.effect.before_per_day} → {log.effect.after_per_day} / day)
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block">Safe Harvest Date (PHI):</span>
                          <span className={`font-black text-xs ${isSafeNow ? 'text-emerald-700' : 'text-amber-600 animate-pulse'}`}>
                            {safeDate || 'Ready'}
                          </span>
                          <span className="text-[10px] text-stone-400 block">
                            {isSafeNow ? '(Safe to harvest)' : '(Do not harvest yet)'}
                          </span>
                        </div>
                        {log.id && (
                          <button
                            onClick={() => handleDeleteSpray(log.id!)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log a Spray Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-xs">
            <h2 className="text-base font-black text-stone-900 mb-4 pb-2 border-b border-stone-200">
              Record Spray Application
            </h2>

            <form onSubmit={handleAddSpray} className="space-y-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Target Pest</label>
                <select
                  value={logPest}
                  onChange={(e) => setLogPest(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="whitefly">Whitefly (ಬಿಳಿ ನೊಣ)</option>
                  <option value="fruit_borer">Fruit Borer (ಕಾಯಿ ಕೊರಕ)</option>
                  <option value="tuta">Tomato Pinworm (ಟ್ಯೂಟಾ)</option>
                  <option value="leafminer">Leaf Miner (ಎಲೆ ಸುರಂಗ)</option>
                  <option value="thrips">Thrips (ನುಸಿ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Product Applied</label>
                <input
                  type="text"
                  required
                  value={logProduct}
                  onChange={(e) => setLogProduct(e.target.value)}
                  placeholder="e.g. Coragen 18.5 SC"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dose Used</label>
                  <input
                    type="text"
                    required
                    value={logDose}
                    onChange={(e) => setLogDose(e.target.value)}
                    placeholder="e.g. 0.3 ml/L"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Waiting Days (PHI)</label>
                  <input
                    type="number"
                    required
                    value={logPhi}
                    onChange={(e) => setLogPhi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Field Notes / Applicator</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Applied in evening with knapsack sprayer, calm wind."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium h-20"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function round(n: number) {
  return Math.round(n * 100) / 100;
}
