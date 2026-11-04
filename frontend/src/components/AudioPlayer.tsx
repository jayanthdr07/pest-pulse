import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AudioPlayerProps {
  textEn: string;
  textKn: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ textEn, textKn }) => {
  const { language, t } = useApp();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
    }
  }, []);

  const handleSpeak = () => {
    if (!isSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = language === 'kn' ? textKn : textEn;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (language === 'kn') {
      utterance.lang = 'kn-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.92; // Slightly slower for clarity in rural agriculture guidance
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleSpeak}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
        isPlaying
          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
      }`}
      title={isPlaying ? t('action_stop_audio') : t('action_listen')}
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4 text-amber-700" />
          <span>{t('action_stop_audio')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-emerald-700" />
          <span>{t('action_listen')}</span>
        </>
      )}
    </button>
  );
};
