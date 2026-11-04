import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Check,
  Send,
  Eye,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';

export const AlertsView: React.FC = () => {
  const { selectedField, refreshHome, t, language } = useApp();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAlerts();
  }, [selectedField?.field_id]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts(50, selectedField?.field_id);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = async (alert: AlertItem, stepIndex: number) => {
    const currentDone = alert.done || [];
    const newDone = currentDone.includes(stepIndex)
      ? currentDone.filter((i) => i !== stepIndex)
      : [...currentDone, stepIndex];

    const updated = await api.updateAlert(alert.id, { done: newDone });
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? updated : a)));
  };

  const handleAcknowledge = async (aid: number) => {
    const updated = await api.updateAlert(aid, { acked: true });
    setAlerts((prev) => prev.map((a) => (a.id === aid ? updated : a)));
    await refreshHome();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            <span>{t('card_alerts')}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {language === 'kn'
              ? 'ಹೊಲದ ಪರಿಶೀಲನೆ, ಕೀಟ ಹೆಚ್ಚಳ ಮತ್ತು ಸಾಧನ ಆಫ್‌ಲೈನ್ ಎಚ್ಚರಿಕೆಗಳು'
              : 'Real-time threshold breaches, rising infestations, battery warnings, and action checklists'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Telegram Alerts: Enabled</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-stone-500">Checking alert notifications...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-900">All Traps & Fields Normal</h3>
          <p className="text-xs text-stone-500 mt-1">No pending risk alerts or inspection tasks.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isHigh = alert.level === 'HIGH';
            const isMedium = alert.level === 'MEDIUM';
            const isAcked = Boolean(alert.acked);

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-6 border shadow-sm transition-all space-y-4 ${
                  !isAcked
                    ? isHigh
                      ? 'border-red-300 ring-2 ring-red-500/15'
                      : 'border-amber-300 ring-2 ring-amber-500/15'
                    : 'border-stone-200 opacity-90'
                }`}
              >
                {/* Alert Title & Severity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isHigh ? 'bg-red-100 text-red-700' : isMedium ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isHigh ? <AlertCircle className="w-5 h-5" /> : isMedium ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-stone-900">
                          {language === 'kn' ? alert.title_kn : alert.title_en}
                        </h3>
                        {!isAcked && (
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{new Date(alert.ts * 1000).toLocaleString()}</span>
                        <span>•</span>
                        <span>Node: {alert.node}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      isHigh
                        ? 'bg-red-100 text-red-800'
                        : isMedium
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {alert.level}
                    </span>
                    {!isAcked && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Explanation */}
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {language === 'kn' ? alert.body_kn : alert.body_en}
                </p>

                {/* Interactive Action Checklist */}
                {alert.steps && alert.steps.length > 0 && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2 text-xs">
                    <span className="font-extrabold text-stone-900 block text-xs">
                      Farmer Action Checklist:
                    </span>
                    <div className="space-y-1.5">
                      {alert.steps.map((step, idx) => {
                        const isDone = (alert.done || []).includes(idx);
                        return (
                          <label
                            key={idx}
                            onClick={() => handleToggleStep(alert, idx)}
                            className="flex items-start gap-2.5 cursor-pointer hover:bg-stone-100/80 p-1.5 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => {}}
                              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className={isDone ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}>
                              {language === 'kn' ? step.kn : step.en}
                            </span>
                          </label>
                        );
                      })}
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
