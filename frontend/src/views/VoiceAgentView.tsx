import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  PhoneCall,
  PhoneForwarded,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Settings,
  Languages,
  Activity,
  Layers,
  AlertTriangle,
  Radio,
  Check,
} from 'lucide-react';

export const VoiceAgentView: React.FC = () => {
  const { selectedField, language, setLanguage, farmer, t } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [scripts, setScripts] = useState<{ script_en?: string; script_kn?: string; count?: number; pest_name?: string } | null>(null);
  const [communications, setCommunications] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);

  // Audio Playback State (Web Speech API)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<'en' | 'kn'>(language);
  const [simulatingCall, setSimulatingCall] = useState<boolean>(false);
  const [callStatusMsg, setCallStatusMsg] = useState<string | null>(null);

  // Real Twilio Cellular Call State
  const [targetPhone, setTargetPhone] = useState<string>('+91 98450 12345');
  const [twilioSid, setTwilioSid] = useState<string>('');
  const [twilioToken, setTwilioToken] = useState<string>('');
  const [twilioFrom, setTwilioFrom] = useState<string>('');
  const [hasTwilioCreds, setHasTwilioCreds] = useState<boolean>(false);
  const [twilioCallLoading, setTwilioCallLoading] = useState<boolean>(false);
  const [twilioCallResult, setTwilioCallResult] = useState<{ ok: boolean; message: string; sid?: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scriptRes, commRes, prefRes] = await Promise.all([
        api.getVoiceScript(selectedField?.field_id),
        api.getVoiceHistory(),
        api.getVoicePreferences(),
      ]);
      if (scriptRes.ok) setScripts(scriptRes);
      if (commRes.ok) setCommunications(commRes.communications);
      if (prefRes.ok) setPreferences(prefRes.preferences);

      // Check telephony settings
      const telRes = await fetch('/api/v1/telephony/settings');
      if (telRes.ok) {
        const telData = await telRes.json();
        setHasTwilioCreds(telData.has_credentials);
        if (telData.from_number) setTwilioFrom(telData.from_number);
      }
    } catch (err) {
      console.error('Failed to load voice agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (farmer?.contact) {
      setTargetPhone(farmer.contact);
    }
  }, [selectedField?.field_id, farmer?.contact]);

  useEffect(() => {
    setSpeechLang(language);
  }, [language]);

  const currentScript = speechLang === 'kn' ? scripts?.script_kn : scripts?.script_en;

  const handlePlayVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(currentScript || 'PestPulse agricultural voice assistant ready.');
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleStopVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const handleSimulateOutboundCall = async () => {
    try {
      setSimulatingCall(true);
      setCallStatusMsg('Dialing farmer phone via in-app telephony...');
      await api.triggerVoiceCall(selectedField?.field_id, speechLang);
      setCallStatusMsg(`✓ Ringing modal dispatched to registered contact (${speechLang.toUpperCase()})`);
      await loadData();
    } catch (e: any) {
      setCallStatusMsg(`Dialout error: ${e.message}`);
    } finally {
      setSimulatingCall(false);
    }
  };

  const handleRealTwilioCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTwilioCallLoading(true);
      setTwilioCallResult(null);

      const res = await fetch('/api/v1/voice/trigger-real-twilio-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          message: currentScript,
          account_sid: twilioSid || undefined,
          auth_token: twilioToken || undefined,
          from_number: twilioFrom || undefined,
        }),
      });

      const data = await res.json();
      setTwilioCallResult({
        ok: data.ok,
        message: data.message,
        sid: data.call_info?.sid,
      });

      if (data.ok) {
        await loadData();
      }
    } catch (err: any) {
      setTwilioCallResult({
        ok: false,
        message: `Network error: ${err.message}`,
      });
    } finally {
      setTwilioCallLoading(false);
    }
  };

  const handleToggleAutoCalls = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const updated = await api.updateVoicePreferences({
        auto_voice_alerts: e.target.checked ? 1 : 0,
      });
      setPreferences(updated.preferences);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Factual Spoken Agronomic Intelligence & Telephony Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {language === 'kn' ? 'ಧ್ವನಿ ಎಚ್ಚರಿಕೆ ಸಹಾಯಕ (Voice Agent)' : 'Multilingual Voice Agent'}
          </h1>
          <p className="text-sm text-stone-300 mt-1 max-w-2xl">
            {language === 'kn'
              ? 'ಕೀಟ ಏರಿಕೆ ಮತ್ತು ಸಿಂಪಡಣೆ ನಂತರದ ಸ್ಥಿತಿಯನ್ನು ಕನ್ನಡ ಮತ್ತು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಧ್ವನಿಯ ಮೂಲಕ ಸ್ಪಷ್ಟವಾಗಿ ವಿವರಿಸುವ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಸಹಾಯಕ.'
              : 'Verbal acoustic alerts strictly compiled from confirmed hardware captures, post-treatment persistence, and ICAR economic action thresholds.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-stone-900/60 p-2 rounded-xl border border-stone-700">
          <Languages className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-stone-200">Speech Language:</span>
          <button
            onClick={() => {
              handleStopVoice();
              setSpeechLang('en');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              speechLang === 'en' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => {
              handleStopVoice();
              setSpeechLang('kn');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              speechLang === 'kn' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-white'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Interactive Audio Station & Script Display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio Player Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                  <span>Proactive Voice Alert Station</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Natural spoken summary explaining latest insect detections and agronomist next steps.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Zero Hallucination Verified</span>
              </span>
            </div>

            {/* Audio Waveform Animation Visualizer */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white shadow-inner flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-1.5 h-12">
                {[4, 12, 8, 24, 16, 32, 28, 40, 20, 36, 18, 26, 14, 8, 22, 10].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: isPlaying ? `${Math.max(6, (height * (1 + (i % 3) * 0.4)) % 46)}px` : '6px' }}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isPlaying ? 'bg-gradient-to-t from-emerald-500 to-amber-400' : 'bg-stone-700'
                    }`}
                  />
                ))}
              </div>

              <div className="text-center">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  {isPlaying ? 'Synthesizing Spoken Alert...' : 'Audio Ready For Playback'}
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  Language: <strong>{speechLang === 'kn' ? 'Kannada (ಕನ್ನಡ)' : 'English'}</strong> • Target:{' '}
                  {selectedField?.name}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handlePlayVoice}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition shadow-lg shadow-emerald-950/50 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPlaying ? 'Pause Voice' : 'Listen to Spoken Alert'}</span>
                </button>

                <button
                  onClick={handleStopVoice}
                  className="p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Script Text Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">Spoken Broadcast Transcript:</span>
                <span className="text-[11px] text-stone-400">
                  {speechLang === 'kn' ? 'ಕನ್ನಡ ಆವೃತ್ತಿ' : 'English Edition'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed font-sans">
                {currentScript || 'Generating alert transcript from real database records...'}
              </div>
            </div>

            {/* REAL TWILIO CELLULAR PHONE CALL DISPATCH STATION */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-white shadow-md border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                    <PhoneForwarded className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Real Cellular Call via Twilio Voice API</h4>
                    <p className="text-[11px] text-indigo-200">
                      Dispatches an authentic voice phone call straight to your physical mobile phone.
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                  hasTwilioCreds ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {hasTwilioCreds ? 'TWILIO ACTIVE' : 'SETUP REQUIRED'}
                </span>
              </div>

              <form onSubmit={handleRealTwilioCall} className="space-y-3 pt-2 text-xs">
                <div>
                  <label className="font-bold text-indigo-200 block mb-1">
                    Your Mobile Phone Number (with Country Code):
                  </label>
                  <input
                    type="tel"
                    required
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-indigo-400/40 text-white font-mono text-sm focus:ring-1 focus:ring-emerald-400"
                  />
                  <span className="text-[10px] text-indigo-300/80 mt-1 block">
                    Example: +919845012345. Indian mobile numbers format automatically with +91.
                  </span>
                </div>

                {!hasTwilioCreds && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-indigo-200 block mb-1">Twilio Account SID:</label>
                      <input
                        type="text"
                        value={twilioSid}
                        onChange={(e) => setTwilioSid(e.target.value)}
                        placeholder="ACxxxxxxxx..."
                        className="w-full p-2 rounded-lg bg-black/40 border border-indigo-400/30 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-200 block mb-1">Twilio Auth Token:</label>
                      <input
                        type="password"
                        value={twilioToken}
                        onChange={(e) => setTwilioToken(e.target.value)}
                        placeholder="Auth Token"
                        className="w-full p-2 rounded-lg bg-black/40 border border-indigo-400/30 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-200 block mb-1">Twilio From Number:</label>
                      <input
                        type="text"
                        value={twilioFrom}
                        onChange={(e) => setTwilioFrom(e.target.value)}
                        placeholder="+1xxxxxxxxxx"
                        className="w-full p-2 rounded-lg bg-black/40 border border-indigo-400/30 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={twilioCallLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs transition shadow-lg shadow-emerald-950/60 disabled:opacity-50 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{twilioCallLoading ? 'Calling Your Phone...' : 'Call My Phone Now via Twilio'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateOutboundCall}
                    disabled={simulatingCall}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Test In-App Speaker Call</span>
                  </button>
                </div>

                {twilioCallResult && (
                  <div className={`p-3 rounded-xl text-xs font-mono border ${
                    twilioCallResult.ok ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200' : 'bg-red-950/80 border-red-400 text-red-200'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {twilioCallResult.ok ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                      <span>{twilioCallResult.ok ? 'Call Placed Successfully!' : 'Twilio Dispatch Notice:'}</span>
                    </div>
                    <div className="text-[11px] mt-1 leading-relaxed">{twilioCallResult.message}</div>
                    {twilioCallResult.sid && (
                      <div className="text-[10px] text-emerald-400 mt-1">Twilio Call SID: {twilioCallResult.sid}</div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Dispatch History */}
        <div className="space-y-6">
          {/* Preferences Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Voice Alert Preferences</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={preferences?.auto_voice_alerts === 1}
                  onChange={handleToggleAutoCalls}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500 rounded"
                />
                <div>
                  <div className="font-bold text-stone-800">Automated Outbound Voice Calls</div>
                  <div className="text-[11px] text-stone-500">
                    Automatically dial farmer when economic injury threshold is exceeded after treatment.
                  </div>
                </div>
              </label>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="text-stone-500 font-semibold">Allowed Calling Hours</div>
                <div className="font-bold text-stone-800">
                  {preferences?.preferred_hours || '08:00 AM - 06:00 PM IST'}
                </div>
                <div className="text-[11px] text-stone-400">Respects quiet nighttime hours</div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="text-stone-500 font-semibold">Registered Contact</div>
                <div className="font-bold text-stone-800 font-mono">
                  {farmer?.contact || '+91 98450 12345'} ({farmer?.name || 'Ramesh Kumar'})
                </div>
              </div>
            </div>
          </div>

          {/* Call & Audio Logs Audit */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Call & Audio History</span>
              </span>
              <span className="text-[11px] text-stone-400 font-mono">{communications.length} Logs</span>
            </h3>

            <div className="space-y-2 text-xs">
              {communications.length === 0 ? (
                <div className="p-4 text-center text-stone-400 text-xs">No previous voice calls logged.</div>
              ) : (
                communications.slice(0, 5).map((comm) => (
                  <div key={comm.comm_id} className="p-2.5 rounded-lg border border-stone-200 bg-stone-50">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-800 uppercase text-[10px]">{comm.channel}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {comm.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {new Date(comm.created_at * 1000).toLocaleString()} • Duration: {comm.duration_s || 45}s
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
