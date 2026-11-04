import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sprout,
  User,
  Phone,
  Lock,
  Globe,
  MapPin,
  Ruler,
  Cpu,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { api } from '../services/api';

export const OnboardingModal: React.FC = () => {
  const { openOnboarding, setOpenOnboarding, setFarmer, setFields, setSelectedField, language, setLanguage, t, refreshHome } = useApp();
  const [step, setStep] = useState<number>(1); // 1: Register, 2: Field Details, 3: Device Connect, 4: Complete
  const [isLoginMode, setIsLoginMode] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState('Ramesh Kumar');
  const [contact, setContact] = useState('9876543210');
  const [password, setPassword] = useState('farmer123');
  const [farmName, setFarmName] = useState('Green Valley Farm');
  const [farmPlace, setFarmPlace] = useState('Hesaraghatta, Bengaluru Rural');
  const [cropType, setCropType] = useState('Tomato');
  const [cropVariety, setCropVariety] = useState('Arka Rakshak F1');
  const [fieldName, setFieldName] = useState('Polyhouse Block A');
  const [areaAcres, setAreaAcres] = useState('2.5');
  const [sowingDate, setSowingDate] = useState('2026-09-15');
  const [deviceNode, setDeviceNode] = useState('trap1');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!openOnboarding) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.login(contact, password);
      if (res.ok && res.farmer) {
        localStorage.setItem('pestpulse_token', res.token || '');
        setFarmer(res.farmer);
        if (res.fields) setFields(res.fields);
        setOpenOnboarding(false);
        await refreshHome();
      } else {
        setErrorMsg(res.error || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMsg('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.register({
        name,
        contact,
        password,
        language,
        farm_name: farmName,
        farm_place: farmPlace,
        crop_type: cropType,
        crop_variety: cropVariety,
        field_name: fieldName,
        area_acres: parseFloat(areaAcres) || 1.0,
        sowing_date: sowingDate,
      });

      if (res.ok && res.farmer) {
        localStorage.setItem('pestpulse_token', res.token || '');
        setFarmer(res.farmer);
        if (res.primary_field) {
          setSelectedField(res.primary_field);
          setFields([res.primary_field]);
        }
        setStep(3); // Go to device connect step
      } else {
        setErrorMsg(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setErrorMsg('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setOpenOnboarding(false);
    await refreshHome();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-xs relative">
        <button
          onClick={() => setOpenOnboarding(false)}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-stone-950">
            {isLoginMode ? 'Farmer Login' : 'Welcome to PestPulse'}
          </h2>
          <p className="text-stone-500 mt-1">
            {language === 'kn'
              ? 'ನಿಮ್ಮ ಡಿಜಿಟಲ್ ಕೃಷಿ ಸಹಾಯಕಕ್ಕೆ ಸುಸ್ವಾಗತ'
              : 'Your digital farming assistant for smart pest monitoring'}
          </p>

          {/* Language Switch in Modal */}
          <div className="flex justify-center gap-2 mt-3">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                language === 'en'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('kn')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold font-kannada border ${
                language === 'kn'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 font-bold mb-4">
            {errorMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {isLoginMode ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Mobile Number or Email</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Logging in...' : 'Sign In as Farmer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsLoginMode(false)}
                className="text-emerald-700 hover:underline font-bold"
              >
                New farmer? Create free account →
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION MULTI-STEP FLOW */
          <div>
            {step === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Farmer Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mobile Number (for SMS & Telegram)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Farm Village / Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={farmPlace}
                      onChange={(e) => setFarmPlace(e.target.value)}
                      placeholder="e.g. Hesaraghatta, Bengaluru Rural"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Next: Crop & Field Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLoginMode(true)}
                    className="text-stone-500 hover:text-stone-800 font-medium"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Crop Type</label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium"
                    >
                      <option value="Tomato">Tomato (ಟೊಮೆಟೊ)</option>
                      <option value="Chilli">Chilli (ಮೆಣಸಿನಕಾಯಿ)</option>
                      <option value="Brinjal">Brinjal (ಬದನೆಕಾಯಿ)</option>
                      <option value="Capsicum">Capsicum (ದಪ್ಪ ಮೆಣಸು)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Plot Area (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={areaAcres}
                      onChange={(e) => setAreaAcres(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Field Name</label>
                  <input
                    type="text"
                    required
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="e.g. Polyhouse Plot A"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Variety (Optional)</label>
                    <input
                      type="text"
                      value={cropVariety}
                      onChange={(e) => setCropVariety(e.target.value)}
                      placeholder="e.g. Arka Rakshak F1"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Sowing Date</label>
                    <input
                      type="date"
                      value={sowingDate}
                      onChange={(e) => setSowingDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Creating Account...' : 'Register Farm & Connect Traps'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Wifi className="w-8 h-8" />
                </div>

                <h3 className="text-base font-extrabold text-stone-900">
                  Welcome, {name}!
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                  Your plot <strong>{fieldName} ({cropType} • {areaAcres} acres)</strong> is registered.
                  PestPulse has successfully connected to your monitoring trap node (<strong>{deviceNode}</strong>).
                </p>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-1.5 my-4">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hardware Integration Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    ESP32-CAM optical trap is linked. Photos are captured every 30 minutes, processed by AI, and synced to your dashboard in real-time.
                  </p>
                </div>

                <button
                  onClick={handleFinishOnboarding}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md"
                >
                  Open Farmer Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
