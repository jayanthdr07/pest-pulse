import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  User,
  Globe,
  Key,
  MapPin,
  Send,
  Save,
  CheckCircle2,
  FileCode,
  FlaskConical,
  RotateCcw,
  Shield,
  Smartphone,
} from 'lucide-react';
import { api } from '../services/api';

import { PageHeader } from '../components/ui/PageHeader';

export const SettingsView: React.FC = () => {
  const { farmer, language, setLanguage, demoMode, setDemoMode, t, refreshHome } = useApp();
  const [name, setName] = useState(farmer?.name || 'Ramesh Kumar');
  const [contact, setContact] = useState(farmer?.contact || '9876543210');
  const [farmName, setFarmName] = useState(farmer?.farm_name || 'Prime Minds Demo Farm');
  const [farmPlace, setFarmPlace] = useState(farmer?.farm_place || 'Hesaraghatta, Bengaluru');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateMe({
        name,
        contact,
        farm_name: farmName,
        farm_place: farmPlace,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      await refreshHome();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <PageHeader
        category="Account Credentials & System Parameters"
        icon={Settings}
        title={`${t('nav_settings') || 'Settings'} & Farmer Profile`}
        description={
          language === 'kn'
            ? 'ರೈತರ ಪ್ರೊಫೈಲ್, ಭಾಷಾ ಆಯ್ಕೆ, ಹಾರ್ಡ್‌ವೇರ್ ಕೀ ಮತ್ತು ನೋಟಿಫಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್ಸ್'
            : 'Configure account credentials, regional language preferences, and device secrets'
        }
      />


      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Farmer profile preferences saved successfully.</span>
        </div>
      )}

      {/* Profile & Language Card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-5 text-xs">
        <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Farmer Account & Farm Location</span>
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Mobile Contact / Phone</label>
              <input
                type="tel"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Farm Name</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Farm Village / Location</label>
              <input
                type="text"
                value={farmPlace}
                onChange={(e) => setFarmPlace(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : t('action_save')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Language & Regional Settings */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs">
        <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Language & Regional Localization</span>
        </h2>
        <p className="text-stone-500">
          Switch between English and Kannada (ಕನ್ನಡ). All advice, cards, buttons, checklists, and voice read-outs will update instantly.
        </p>

        <div className="flex gap-4 pt-2">
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 p-4 rounded-2xl border text-center font-bold transition-all ${
              language === 'en'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                : 'border-stone-200 hover:bg-stone-50 text-stone-700'
            }`}
          >
            <span className="text-base block mb-0.5">English</span>
            <span className="text-[11px] text-stone-400 font-normal">English Language Interface</span>
          </button>

          <button
            onClick={() => setLanguage('kn')}
            className={`flex-1 p-4 rounded-2xl border text-center font-bold font-kannada transition-all ${
              language === 'kn'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                : 'border-stone-200 hover:bg-stone-50 text-stone-700'
            }`}
          >
            <span className="text-base block mb-0.5">ಕನ್ನಡ</span>
            <span className="text-[11px] text-stone-400 font-normal">ಕನ್ನಡ ಇಂಟರ್ಫೇಸ್ (Kannada)</span>
          </button>
        </div>
      </div>

      {/* Hardware Device Ingestion Keys */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs">
        <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-600" />
          <span>Device Key & Ingestion Security</span>
        </h2>
        <p className="text-stone-500">
          Copy this device key into your ESP32-CAM firmware sketch <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">pestpulse_cam.ino</code>.
        </p>

        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700">HTTP Ingestion Key (X-Device-Key):</span>
            <span className="font-mono text-emerald-800 font-bold bg-white px-3 py-1 rounded-lg border border-stone-200">
              change-me-device-key
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span>Cloud Ingestion Address:</span>
            <span className="font-mono text-stone-700">http://localhost:8080/api/v1/ingest</span>
          </div>
        </div>
      </div>

      {/* Demo Mode Toggle */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-500" />
              <span>Simulated Demo Mode vs Live Hardware</span>
            </h2>
            <p className="text-stone-500">
              Clearly distinguishes real hardware observations from computer-synthesized demo presentations.
            </p>
          </div>

          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              demoMode
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-emerald-600 text-white shadow-md'
            }`}
          >
            {demoMode ? 'Demo Mode Active' : 'Live Hardware Active'}
          </button>
        </div>
      </div>
    </div>
  );
};
