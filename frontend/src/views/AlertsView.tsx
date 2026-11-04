import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Send,
} from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskPill } from '../components/ui/RiskPill';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

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
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        category="Emergency Actions & Field Telemetry Alerts"
        icon={Bell}
        title={t('card_alerts') || 'Alerts Center'}
        description={
          language === 'kn'
            ? 'ಹೊಲದ ಪರಿಶೀಲನೆ, ಕೀಟ ಹೆಚ್ಚಳ ಮತ್ತು ಸಾಧನ ಆಫ್‌ಲೈನ್ ಎಚ್ಚರಿಕೆಗಳು'
            : 'Real-time threshold breaches, rising infestations, battery warnings, and farmer action checklists'
        }
        action={
          <span className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 font-bold flex items-center gap-2 text-xs">
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telegram Bot: Active</span>
          </span>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All Traps & Fields Normal"
          description="No pending risk alerts or inspection tasks. Optical traps are reporting normal insect densities."
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const isHigh = alert.level === 'HIGH';
            const isMedium = alert.level === 'MEDIUM';
            const isAcked = Boolean(alert.acked);

            return (
              <Card
                key={alert.id}
                className={`p-5 sm:p-6 transition-all space-y-4 ${
                  !isAcked
                    ? isHigh
                      ? 'border-red-300 ring-2 ring-red-500/15'
                      : 'border-amber-300 ring-2 ring-amber-500/15'
                    : 'border-stone-200 opacity-90'
                }`}
              >
                {/* Alert Title & Severity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isHigh
                          ? 'bg-red-100 text-red-700'
                          : isMedium
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isHigh ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : isMedium ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-stone-900">
                          {language === 'kn' ? alert.title_kn : alert.title_en}
                        </h3>
                        {!isAcked && (
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
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
                    <RiskPill level={alert.level} size="sm" />
                    {!isAcked && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>

                {/* Body Explanation */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                  {language === 'kn' ? alert.body_kn : alert.body_en}
                </p>

                {/* Interactive Action Checklist */}
                {alert.steps && alert.steps.length > 0 && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-2 text-xs">
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
                            className="flex items-start gap-2.5 cursor-pointer hover:bg-stone-100 p-2 rounded-xl transition-colors min-h-[36px]"
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => {}}
                              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={
                                isDone
                                  ? 'line-through text-stone-400'
                                  : 'text-stone-800 font-medium'
                              }
                            >
                              {language === 'kn' ? step.kn : step.en}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
