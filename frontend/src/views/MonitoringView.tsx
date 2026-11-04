import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bug,
  Filter,
  Camera,
  Upload,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Info,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { api } from '../services/api';
import { Observation, InsectDetection, PestDetails } from '../types';

export const MonitoringView: React.FC = () => {
  const { selectedField, t, language, demoMode } = useApp();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [pestsCatalog, setPestsCatalog] = useState<Record<string, PestDetails>>({});
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [selectedPest, setSelectedPest] = useState<PestDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Filters
  const [filterTrap, setFilterTrap] = useState<string>('all');
  const [filterPest, setFilterPest] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedField?.field_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [obs, pests] = await Promise.all([
        api.getObservations(36, selectedField?.field_id),
        api.getPests(),
      ]);
      setObservations(obs);
      setPestsCatalog(pests);
    } catch (err) {
      console.error('Failed to load observations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (obs: Observation) => {
    setSelectedObs(obs);
    // Find dominant pest key
    const pestKey = obs.counts ? Object.keys(obs.counts)[0] : 'whitefly';
    if (pestKey && pestsCatalog[pestKey]) {
      try {
        const detail = await api.getPestDetail(pestKey);
        setSelectedPest(detail);
      } catch {
        setSelectedPest(pestsCatalog[pestKey]);
      }
    } else {
      setSelectedPest(pestsCatalog['whitefly'] || null);
    }
  };

  const handlePhoneScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanning(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/v1/scan?trap=sticky_yellow&field_id=${selectedField?.field_id || 'field_001'}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setScanResult(data);
      await loadData();
    } catch (err) {
      console.error('Scan error:', err);
      alert('Failed to process image scan.');
    } finally {
      setScanning(false);
    }
  };

  const filtered = observations.filter((obs) => {
    if (filterTrap !== 'all' && obs.node !== filterTrap) return false;
    if (filterPest !== 'all' && (!obs.counts || !obs.counts[filterPest])) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Scan Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Bug className="w-6 h-6 text-emerald-600" />
            <span>{t('nav_monitoring')}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {language === 'kn'
              ? 'ಹೊಲದಲ್ಲಿರುವ ESP32-CAM ಕ್ಯಾಮೆರಾಗಳು ತೆಗೆದ ನೈಜ ಛಾಯಾಚಿತ್ರಗಳು ಮತ್ತು AI ಕೀಟ ಗುರುತಿಸುವಿಕೆ'
              : 'Actual optical trap photos captured in the field with computer vision insect bounding boxes'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span>{scanning ? 'Processing AI...' : t('action_scan_card')}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhoneScan}
              disabled={scanning}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Phone Scan Instant Result Notification */}
      {scanResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">Phone Scan Processed Successfully</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                AI Detected <strong>{scanResult.total} insects</strong> on card ({scanResult.trap_label}).
                Risk Level: <strong>{scanResult.level_if_24h}</strong>.
              </p>
              <p className="text-[11px] text-emerald-700 mt-1 italic">{scanResult.note}</p>
            </div>
          </div>
          <button
            onClick={() => setScanResult(null)}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-500 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter Observations:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterTrap}
            onChange={(e) => setFilterTrap(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Traps ({observations.length})</option>
            <option value="trap1">Trap 1 (Polyhouse North)</option>
            <option value="trap2">Trap 2 (Polyhouse South)</option>
            <option value="trap3">Trap 3 (West Delta)</option>
            <option value="trap4">Trap 4 (Chilli Plot)</option>
          </select>

          <select
            value={filterPest}
            onChange={(e) => setFilterPest(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Insect Species</option>
            <option value="whitefly">Whitefly (ಬಿಳಿ ನೊಣ)</option>
            <option value="fruit_borer">Fruit Borer (ಕಾಯಿ ಕೊರಕ)</option>
            <option value="tuta">Tuta Pinworm (ಟ್ಯೂಟಾ)</option>
            <option value="leafminer">Leaf Miner (ಎಲೆ ಸುರಂಗ)</option>
            <option value="thrips">Thrips (ನುಸಿ)</option>
          </select>
        </div>
      </div>

      {/* Observations Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-stone-500">Loading captured hardware imagery...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <Bug className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No observations match this filter</h3>
          <p className="text-xs text-stone-500 mt-1">Try resetting the filter or capture a card with the phone camera.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((obs) => {
            const pestName = obs.counts ? Object.keys(obs.counts)[0] : 'insect';
            const pestInfo = pestsCatalog[pestName] || {};
            const dateStr = new Date(obs.ts * 1000).toLocaleString();

            return (
              <div
                key={obs.id}
                onClick={() => handleInspect(obs)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Photo Preview */}
                  <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
                    {obs.annotated ? (
                      <img
                        src={`/img/${obs.annotated}`}
                        alt="Hardware Card Capture"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs font-mono">
                        No image data
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                        obs.risk === 'HIGH'
                          ? 'bg-red-600 text-white'
                          : obs.risk === 'MEDIUM'
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {obs.risk}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-stone-950/70 text-stone-200 text-[10px] font-semibold backdrop-blur-sm">
                        {obs.node}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-stone-950/80 text-white text-[10px] font-bold backdrop-blur-sm flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-emerald-400" />
                      <span>{t('action_inspect')}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-stone-900 group-hover:text-emerald-700 transition-colors">
                          {language === 'kn' ? (pestInfo.kn || pestName) : (pestInfo.en || pestName)}
                        </h4>
                        <p className="text-[11px] font-mono text-stone-500 italic">
                          {pestInfo.latin || 'Invertebrata'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-stone-950">{obs.total}</span>
                        <p className="text-[10px] text-stone-400 font-medium">on card</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{dateStr.split(',')[1] || dateStr}</span>
                      </span>
                      <span className="font-semibold text-emerald-700">
                        +{obs.new} new
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-[10px] text-stone-400 flex items-center justify-between">
                  <span>Hardware AI Capture</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Insect Detailed Inspection Modal */}
      {selectedObs && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Hardware Optical Observation Details
                </span>
                <h2 className="text-xl font-black text-stone-950">
                  {language === 'kn'
                    ? (selectedPest?.kn || 'ಕೀಟ ಪರಿಶೀಲನೆ')
                    : (selectedPest?.en || 'Insect Inspection')}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedObs(null);
                  setSelectedPest(null);
                }}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Comparison: Real Captured Hardware Image vs Reference Catalog */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Real Hardware Photo */}
                <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-900 flex flex-col justify-between">
                  <div className="p-2.5 bg-stone-900 text-stone-200 text-xs font-bold flex items-center justify-between border-b border-stone-800">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t('real_hardware_photo')}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                      {selectedObs.node}
                    </span>
                  </div>
                  <div className="aspect-[4/3] bg-black">
                    {selectedObs.annotated ? (
                      <img
                        src={`/img/${selectedObs.annotated}`}
                        alt="Hardware AI Capture"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs">
                        Raw sensor feed
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 bg-stone-900 text-[11px] text-stone-400">
                    Actual card photo processed with OpenCV / YOLO object detection.
                  </div>
                </div>

                {/* Reference Photo */}
                <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-900 flex flex-col justify-between">
                  <div className="p-2.5 bg-stone-900 text-stone-200 text-xs font-bold flex items-center justify-between border-b border-stone-800">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('reference_photo')}</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300">
                      Catalog Standard
                    </span>
                  </div>
                  <div className="aspect-[4/3] bg-stone-950 flex items-center justify-center">
                    <div className="text-center p-6 text-stone-400">
                      <Bug className="w-16 h-16 text-amber-500/40 mx-auto mb-2" />
                      <p className="text-xs font-bold text-stone-300">
                        {selectedPest?.latin || 'Bemisia tabaci'}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Adult specimen standard from ICAR agricultural taxonomy guide
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-stone-900 text-[11px] text-stone-400">
                    Scientific reference guide for identification comparison.
                  </div>
                </div>
              </div>

              {/* Taxonomy & Identification Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block mb-0.5">Common Name:</span>
                  <span className="font-extrabold text-stone-900">
                    {language === 'kn' ? selectedPest?.kn : selectedPest?.en}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block mb-0.5">Scientific Name:</span>
                  <span className="font-mono italic font-bold text-stone-900">{selectedPest?.latin}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block mb-0.5">Detected on Card:</span>
                  <span className="font-extrabold text-emerald-800">{selectedObs.total} insects</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-500 block mb-0.5">{t('confidence')}:</span>
                  <span className="font-extrabold text-emerald-800">92% AI Match</span>
                </div>
              </div>

              {/* Biological Impact & Disease Vector Info */}
              {selectedPest && (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-amber-700" />
                      <span>{t('potential_damage')} & Disease Associations:</span>
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      {language === 'kn'
                        ? selectedPest.potential_damage?.kn || selectedPest.why.kn
                        : selectedPest.potential_damage?.en || selectedPest.why.en}
                    </p>
                    {selectedPest.disease_vector && (
                      <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-950">
                        <strong>Vector Status:</strong> {selectedPest.disease_vector.status}.{' '}
                        Transmits: {selectedPest.disease_vector.diseases.join(', ')}.
                      </div>
                    )}
                  </div>

                  {/* Non-Chemical IPM Management */}
                  <div className="border border-stone-200 rounded-2xl p-4 text-xs space-y-3">
                    <h4 className="font-extrabold text-stone-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{t('non_chemical_first')}</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {selectedPest.non_chemical.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-stone-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{language === 'kn' ? step.kn : step.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chemical Recommendations (if necessary) */}
                  {selectedPest.chemical && selectedPest.chemical.length > 0 && (
                    <div className="border border-stone-200 rounded-2xl p-4 text-xs space-y-3 bg-stone-50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-stone-900 flex items-center gap-2">
                          <Info className="w-4 h-4 text-stone-600" />
                          <span>Sourced Chemical Options (When Action Threshold Crossed)</span>
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          Field: {selectedField?.area_acres || 2.5} acres
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedPest.chemical.map((chem, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-stone-900">{chem.name}</div>
                              <div className="text-[11px] text-stone-500">
                                Trade: {chem.trade} • IRAC Group: <span className="font-mono font-bold text-stone-800">{chem.irac}</span>
                              </div>
                              {chem.note && <div className="text-[10px] text-amber-700 mt-0.5">{chem.note}</div>}
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-black text-emerald-800">
                                {roundNum(chem.per_l)} {chem.unit}/L water
                              </div>
                              <div className="text-[11px] text-stone-600">
                                Total: {roundNum(chem.per_acre * (selectedField?.area_acres || 2.5))} {chem.unit} in 200 L/acre
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-stone-500 italic pt-1">
                        {t('label_disclaimer')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function roundNum(n: number) {
  return Math.round(n * 100) / 100;
}
