import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  HeartPulse,
  Bug,
  ShieldCheck,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Disease } from '../types';

export const DiseasesView: React.FC = () => {
  const { selectedField, t, language } = useApp();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>('tolcv');

  useEffect(() => {
    loadDiseases();
  }, [selectedField?.crop_type]);

  const loadDiseases = async () => {
    try {
      setLoading(true);
      const data = await api.getDiseases(selectedField?.crop_type);
      setDiseases(data);
    } catch (err) {
      console.error('Failed to load diseases:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-emerald-600" />
          <span>Crop Diseases & Insect Vector Relationships</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          {language === 'kn'
            ? 'ಕೀಟಗಳು ಹರಡುವ ಅಥವಾ ಉಂಟುಮಾಡುವ ರೋಗಲಕ್ಷಣಗಳು, ತಡೆಗಟ್ಟುವ ಕ್ರಮಗಳು ಮತ್ತು ICAR ತಜ್ಞರ ಮಾರ್ಗದರ್ಶಿ'
            : 'Scientifically verified plant disease vectors, entry wound facilitators, and non-vectored leaf blights'}
        </p>
      </div>

      {/* Critical Scientific Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-amber-950">Diagnostic Transparency Note:</h3>
          <p className="text-amber-900 leading-relaxed">
            Detecting an insect on a trap does NOT constitute a confirmed plant disease diagnosis. Whiteflies, for example,
            are known vectors of Tomato Leaf Curl Virus (ToLCV), but field confirmation requires visual foliage inspection for upward curling
            or laboratory PCR testing. This section distinguishes confirmed vectors from opportunistic wound invaders.
          </p>
        </div>
      </div>

      {/* Disease Cards List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500">Loading plant pathology database...</div>
      ) : (
        <div className="space-y-4">
          {diseases.map((d) => {
            const isExpanded = expandedId === d.id;
            const isConfirmedVector = d.vector_status.includes('Confirmed');

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Accordion Bar */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-stone-50/80 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isConfirmedVector ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-stone-900">
                        {language === 'kn' ? d.name_kn : d.name_en}
                      </h3>
                      <p className="text-xs text-stone-500 font-mono italic">{d.pathogen}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isConfirmedVector
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {language === 'kn' ? d.vector_status_kn : d.vector_status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t border-stone-100 space-y-5 text-xs">
                    {/* Symptoms & Transmission Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1.5">
                        <span className="font-bold text-stone-900 block text-xs">
                          Visual Symptoms & Signs:
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {language === 'kn' ? d.symptoms.kn : d.symptoms.en}
                        </p>
                      </div>

                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1.5">
                        <span className="font-bold text-stone-900 block text-xs">
                          How the Disease Spreads (Etiology):
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {language === 'kn' ? d.transmission_explanation.kn : d.transmission_explanation.en}
                        </p>
                      </div>
                    </div>

                    {/* Vector relationship box */}
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Associated Vector: {language === 'kn' ? d.vector_name_kn : d.vector_name_en}
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Classification: {d.vector_status}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Affected Crops: {d.crops.join(', ')}
                      </span>
                    </div>

                    {/* Crop Damage & Prevention */}
                    <div className="space-y-2">
                      <span className="font-extrabold text-stone-900 block text-xs">
                        Preventive Cultural Practices & Sanitation:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {d.prevention.map((prev, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white border border-stone-200 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-stone-800">{language === 'kn' ? prev.kn : prev.en}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expert Consultation */}
                    <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-950">
                      <div>
                        <strong>When to Consult an Agricultural Officer: </strong>
                        <span>{language === 'kn' ? d.expert_consultation.kn : d.expert_consultation.en}</span>
                      </div>
                    </div>

                    {/* Citation */}
                    <div className="flex justify-between items-center text-[11px] text-stone-400 pt-1">
                      <span>Source: {d.source}</span>
                      {d.source_url && (
                        <a
                          href={d.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
                        >
                          <span>ICAR Citation</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
