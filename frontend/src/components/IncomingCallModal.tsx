import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Volume2, ShieldAlert, UserCheck } from 'lucide-react';

interface IncomingCallData {
  call_id: string;
  call_type: 'emergency_outbreak' | 'doctor_acceptance' | 'scan_summary';
  title: string;
  urgency: 'critical' | 'high' | 'normal';
  script_en: string;
  script_kn: string;
  phone: string;
  timestamp: number;
  metadata?: any;
}

export const IncomingCallModal: React.FC = () => {
  const [call, setCall] = useState<IncomingCallData | null>(null);
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [speakingLanguage, setSpeakingLanguage] = useState<'en' | 'kn'>('en');
  const [callDuration, setCallDuration] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Poll for incoming calls from backend every 3 seconds
  useEffect(() => {
    let isMounted = true;
    const checkIncomingCall = async () => {
      if (callState === 'connected' || callState === 'ringing') return;
      try {
        const res = await fetch('/api/v1/voice/latest-call');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.has_call && data.incoming_call) {
            const incoming: IncomingCallData = data.incoming_call;
            // Check if this call is recent (within 45 seconds)
            if (Date.now() / 1000 - incoming.timestamp < 45) {
              setCall(incoming);
              setCallState('ringing');
              startRingtone(incoming.urgency === 'critical');
            }
          }
        }
      } catch (err) {
        // network or server startup
      }
    };

    const interval = setInterval(checkIncomingCall, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [callState]);

  // Ringtone generator via HTML5 Web Audio API
  const startRingtone = (isEmergency: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playToneBurst = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        if (isEmergency) {
          // Emergency two-tone siren (750 Hz to 1100 Hz sweep)
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(750, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
          osc.frequency.exponentialRampToValueAtTime(750, now + 0.8);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
          osc.connect(gain);
          osc.start(now);
          osc.stop(now + 0.9);
        } else {
          // Dual-frequency telephone ringing (440 Hz + 480 Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.frequency.setValueAtTime(480, now);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.setValueAtTime(0.25, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

          osc1.connect(gain);
          osc2.connect(gain);
          osc1.start(now);
          osc2.start(now + 1.4);
          osc1.stop(now + 1.4);
          osc2.stop(now + 1.4);
        }
      };

      playToneBurst();
      ringIntervalRef.current = setInterval(playToneBurst, isEmergency ? 1100 : 2500);
    } catch (e) {
      console.warn('AudioContext ringtone initialization:', e);
    }
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  // Answer call
  const handleAnswerCall = () => {
    stopRingtone();
    setCallState('connected');
    setCallDuration(0);

    // Tell backend call was answered
    if (call?.call_id) {
      fetch('/api/v1/voice/answer-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: call.call_id }),
      }).catch(() => {});
    }

    // Start duration timer
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Speak message aloud via Web Speech API
    if ('speechSynthesis' in window && call) {
      window.speechSynthesis.cancel();
      const textToSpeak = call.script_en;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // When English finishes, speak Kannada or complete call
      utterance.onend = () => {
        if (call.script_kn) {
          setSpeakingLanguage('kn');
          const knUtterance = new SpeechSynthesisUtterance(call.script_kn);
          knUtterance.rate = 0.9;
          knUtterance.onend = () => {
            // Finished
          };
          window.speechSynthesis.speak(knUtterance);
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  // Decline or hang up
  const handleEndCall = () => {
    stopRingtone();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (call?.call_id) {
      fetch('/api/v1/voice/answer-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: call.call_id }),
      }).catch(() => {});
    }
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setCall(null);
      setCallDuration(0);
      setSpeakingLanguage('en');
    }, 1200);
  };

  // Format call duration MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle' || !call) {
    return null;
  }

  const isEmergency = call.urgency === 'critical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border ${
        isEmergency ? 'bg-gradient-to-b from-red-950 via-zinc-900 to-black border-red-500/50' : 'bg-gradient-to-b from-emerald-950 via-zinc-900 to-black border-emerald-500/40'
      }`}>
        {/* Glow ambient background effect */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-30 ${
          isEmergency ? 'bg-red-500' : 'bg-emerald-500'
        }`} />

        <div className="relative p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Header pill */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 ${
            isEmergency ? 'bg-red-500/20 text-red-3xl text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isEmergency ? <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" /> : <PhoneCall className="w-4 h-4 text-emerald-400 animate-pulse" />}
            {callState === 'ringing' ? (isEmergency ? 'CRITICAL OUTBREAK SIREN' : 'INCOMING TELEPHONE CALL') : 'CALL IN PROGRESS'}
          </div>

          {/* Caller Avatar / Pulsing Icon */}
          <div className="relative my-4">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-xl ${
              isEmergency ? 'bg-gradient-to-tr from-red-600 to-red-500' : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
            }`}>
              {isEmergency ? (
                <ShieldAlert className="w-14 h-14 text-white animate-bounce" />
              ) : call.call_type === 'doctor_acceptance' ? (
                <UserCheck className="w-14 h-14 text-white" />
              ) : (
                <Phone className="w-14 h-14 text-white" />
              )}
            </div>

            {/* Pulsing rings during ringing */}
            {callState === 'ringing' && (
              <>
                <div className={`absolute inset-0 rounded-full animate-ping opacity-35 ${isEmergency ? 'bg-red-500' : 'bg-emerald-400'}`} />
                <div className={`absolute -inset-3 rounded-full animate-pulse opacity-25 border-2 ${isEmergency ? 'border-red-400' : 'border-emerald-300'}`} />
              </>
            )}
          </div>

          {/* Caller ID / Title */}
          <h2 className="text-2xl font-black text-white mt-2 mb-1 tracking-tight">
            {call.title}
          </h2>
          <p className="text-sm font-medium text-zinc-400 mb-2">
            Target Contact: <span className="text-zinc-200 font-mono">{call.phone}</span>
          </p>

          {/* Call Status / Duration */}
          <div className="text-sm font-semibold mb-6">
            {callState === 'ringing' && (
              <span className={`inline-flex items-center gap-1.5 ${isEmergency ? 'text-red-400 animate-pulse' : 'text-emerald-400 animate-pulse'}`}>
                <Volume2 className="w-4 h-4" /> Device audio ringing out loud...
              </span>
            )}
            {callState === 'connected' && (
              <span className="text-emerald-400 font-mono tracking-widest text-base">
                {formatTime(callDuration)} • Speaking ({speakingLanguage.toUpperCase()})
              </span>
            )}
            {callState === 'ended' && (
              <span className="text-zinc-400">Call Ended</span>
            )}
          </div>

          {/* Connected Live Voice Transcript */}
          {callState === 'connected' && (
            <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-left mb-6 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-2">
                <span>LIVE VOICE BROADCAST:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Active Audio
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans mb-3">
                {call.script_en}
              </p>
              {call.script_kn && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <p className="text-xs text-emerald-300 font-sans leading-relaxed">
                    {call.script_kn}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex items-center justify-center gap-8 mt-2">
            {callState === 'ringing' && (
              <>
                {/* Decline Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 group-hover:scale-105">
                    <PhoneOff className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-zinc-400 group-hover:text-red-400">Decline</span>
                </button>

                {/* Answer Button */}
                <button
                  type="button"
                  onClick={handleAnswerCall}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={`w-20 h-20 rounded-full text-white flex items-center justify-center shadow-2xl transition-transform active:scale-95 group-hover:scale-110 ${
                    isEmergency ? 'bg-gradient-to-r from-red-600 to-amber-600 animate-pulse' : 'bg-gradient-to-r from-emerald-500 to-teal-500 animate-bounce'
                  }`}>
                    <PhoneCall className="w-9 h-9" />
                  </div>
                  <span className="text-xs font-black text-white group-hover:text-emerald-400">Answer Now</span>
                </button>
              </>
            )}

            {callState === 'connected' && (
              <button
                type="button"
                onClick={handleEndCall}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl transition-transform active:scale-95 group-hover:scale-105">
                  <PhoneOff className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold text-zinc-300 group-hover:text-red-400">End Call</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
