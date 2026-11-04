import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Video,
  Calendar,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Sparkles,
  PhoneCall,
  MapPin,
  ExternalLink,
  Plus,
  QrCode,
  FileText,
  X,
  CheckCircle2,
  RefreshCw,
  Camera,
  Layers,
  Star,
  Maximize2,
  Mail,
  Copy,
  Check,
  Settings,
  Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ConsultationView: React.FC = () => {
  const { selectedField, language, t } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [experts, setExperts] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<any | null>(null);
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [activeCallAppt, setActiveCallAppt] = useState<any | null>(null);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SMTP Settings State
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpStatus, setSmtpStatus] = useState<string>('');
  const [smtpSaving, setSmtpSaving] = useState<boolean>(false);

  const [bookingForm, setBookingForm] = useState({
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointment_time: '10:30 AM',
    consultation_type: 'video',
    problem_description: '',
    attach_passport: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, apptRes, escRes] = await Promise.all([
        api.getExperts(),
        api.getAppointments(),
        api.getEscalations(),
      ]);

      if (expRes.ok) setExperts(expRes.experts || []);
      if (apptRes.ok) setAppointments(apptRes.appointments || []);
      if (escRes.ok) setEscalations(escRes.escalations || []);
    } catch (err) {
      console.error('Error loading consultation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load existing SMTP user if saved
    fetch('/api/v1/emailer/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.settings) {
          setSmtpUser(data.settings.user || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSmtpSaving(true);
      setSmtpStatus('Saving SMTP credentials...');
      const res = await fetch('/api/v1/emailer/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: smtpUser, password: smtpPass }),
      });
      const data = await res.json();
      if (data.ok) {
        setSmtpStatus('✓ SMTP credentials saved! Background emails enabled.');
        setTimeout(() => setShowEmailModal(false), 1500);
      } else {
        setSmtpStatus('Failed to save settings.');
      }
    } catch (e: any) {
      setSmtpStatus(`Error: ${e.message}`);
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpert || !selectedField) return;

    try {
      setBookingLoading(true);
      const res = await api.createAppointment({
        expert_id: selectedExpert.expert_id,
        field_id: selectedField.field_id,
        crop_type: selectedField.crop_type,
        appointment_date: bookingForm.appointment_date,
        appointment_time: bookingForm.appointment_time,
        consultation_type: bookingForm.consultation_type,
        problem_description: bookingForm.problem_description,
      });

      // Automatically dispatch email invitation
      if (res.gmail_web_url && !res.smtp_sent) {
        window.open(res.gmail_web_url, '_blank');
      }

      // Automatically accept appointment and trigger real phone call without manual clicks
      if (res.appointment?.appointment_id) {
        try {
          await api.simulateAcceptAppointment(res.appointment.appointment_id);
        } catch (callErr) {
          console.warn('Auto-call trigger error:', callErr);
        }
      }

      setShowBookModal(false);
      await loadData();
      if (res.appointment) {
        setActiveCallAppt(res.appointment);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Booking error: ${err.message || 'Failed to book appointment'}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const buildGmailWebUrl = (appt: any) => {
    const docEmail = appt.expert_email || 'jayanthgowda1406@gmail.com';
    const docName = appt.expert_name || 'Dr. Jayanth Gowda';
    const subject = `[PestPulse] Agronomist Video Consultation: ${selectedField?.name || 'Field'} (${appt.crop_type || 'Crop'})`;
    const acceptUrl = `http://172.17.24.144:8080/api/v1/appointments/${appt.appointment_id}/accept?token=${appt.accept_token}`;
    const jitsiUrl = `https://meet.jit.si/${appt.jitsi_room_id}`;
    const body = `Dear ${docName},\n\nYou have an urgent agricultural consultation scheduled on ${appt.appointment_date} at ${appt.appointment_time}.\n\nField: ${selectedField?.name || 'Main Field'} (${appt.crop_type || 'Crop'})\nIssue: ${appt.problem_description || 'Pest surge requiring specialist review.'}\n\n👉 CLICK HERE TO ACCEPT & AUTO-CALL FARMER:\n${acceptUrl}\n\n🎥 JOIN JITSI VIDEO ROOM:\n${jitsiUrl}\n\n— PestPulse Agricultural Platform`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(docEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copyAppointmentInvite = (appt: any) => {
    const docEmail = appt.expert_email || 'jayanthgowda1406@gmail.com';
    const acceptUrl = `http://172.17.24.144:8080/api/v1/appointments/${appt.appointment_id}/accept?token=${appt.accept_token}`;
    const jitsiUrl = `https://meet.jit.si/${appt.jitsi_room_id}`;
    const text = `PestPulse Consultation for ${appt.expert_name} (${docEmail}):\nDate: ${appt.appointment_date} at ${appt.appointment_time}\nAccept & Auto-Call Link: ${acceptUrl}\nJitsi Video Room: ${jitsiUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedId(appt.appointment_id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const activeEscalation = escalations.length > 0 ? escalations[0] : null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-stone-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Video className="w-4 h-4" />
            <span>ICAR & UAS Verified Agricultural Tele-Consultation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {language === 'kn' ? 'ಕೃಷಿ ತಜ್ಞರ ಸಮಾಲೋಚನೆ & ವೀಡಿಯೊ ಕರೆ' : 'Agronomist Consultation & Video Call'}
          </h1>
          <p className="text-sm text-stone-300 mt-1 max-w-2xl">
            {language === 'kn'
              ? 'ಕೀಟ ಹಾವಳಿ ಹೆಚ್ಚಾದಾಗ ICAR-IIHR ಮತ್ತು UAS ವಿಜ್ಞಾನಿಗಳೊಂದಿಗೆ ನೇರ Jitsi ವೀಡಿಯೊ ಸಮಾಲೋಚನೆ ನಡೆಸಿ ಅಧಿಕೃತ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.'
              : 'Direct peer-to-peer Jitsi video consultations with ICAR and state agricultural university entomologists with integrated Crop Passport pre-briefing.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-emerald-300" />
            <span>Email Dispatch Settings</span>
          </button>

          <button
            onClick={() => {
              setSelectedExpert(experts[0] || null);
              setShowBookModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Appointment</span>
          </button>
        </div>
      </div>

      {/* Doctor Email Registry Info Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs text-xs text-emerald-950">
        <div className="flex items-center gap-2 font-black text-emerald-900 mb-1.5 text-sm">
          <Mail className="w-4 h-4 text-emerald-700" />
          <span>Active Agronomist Email Invitation Routing:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2">
          <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
            <div className="font-bold text-stone-900">Dr. Jayanth Gowda</div>
            <div className="text-emerald-700 font-mono text-[11px] truncate">jayanthgowda1406@gmail.com</div>
            <div className="text-[10px] text-stone-500 mt-0.5">Chief Entomologist • Fall Armyworm, IPM</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
            <div className="font-bold text-stone-900">Dr. Srujan R</div>
            <div className="text-emerald-700 font-mono text-[11px] truncate">srujanr173@gmail.com</div>
            <div className="text-[10px] text-stone-500 mt-0.5">Plant Pathologist • Leaf Curl & Vectors</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-emerald-200">
            <div className="font-bold text-stone-900">Dr. Hruthik Gowda</div>
            <div className="text-emerald-700 font-mono text-[11px] truncate">hruthikgowda.200521@gmail.com</div>
            <div className="text-[10px] text-stone-500 mt-0.5">Horticulture Specialist • Pheromones & Thrips</div>
          </div>
        </div>
      </div>

      {/* Escalation Alert Notification Banner */}
      {activeEscalation && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm text-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-200/80 text-red-900 font-extrabold text-[10px] uppercase">
                  Pest Escalation Triggered
                </div>
                <h3 className="font-black text-red-950 text-sm sm:text-base mt-1">
                  {language === 'kn' ? 'ಕೀಟ ಚಟುವಟಿಕೆಗೆ ತಜ್ಞರ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ' : 'Pest activity needs expert review'}
                </h3>
                <p className="text-red-900 mt-1 leading-relaxed">
                  {language === 'kn' ? activeEscalation.reason_kn : activeEscalation.reason_en}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-red-600 text-white shrink-0">
              HIGH RISK
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Upcoming Appointments & Verified Experts Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Appointments */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Scheduled Appointments</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {appointments.length} Booked
              </span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Confirmed video appointments with direct email dispatch & auto-calling.
            </p>

            {appointments.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs border-2 border-dashed border-stone-200 rounded-xl">
                No consultations scheduled. Click <strong>"Schedule New Appointment"</strong> to book an expert.
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div
                    key={appt.appointment_id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-stone-900 text-sm">
                          {appt.expert_name || 'Dr. Jayanth Gowda'}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {appt.expert_title || 'Chief Entomologist'}
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {appt.status}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>Date: <strong>{appt.appointment_date}</strong></span>
                        <span className="text-stone-400">•</span>
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Time: <strong>{appt.appointment_time}</strong></span>
                      </div>
                      <div className="text-[11px] text-emerald-800 font-mono flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded">
                        <span>Doctor Email: <strong>{appt.expert_email || 'jayanthgowda1406@gmail.com'}</strong></span>
                      </div>
                    </div>

                    {appt.problem_description && (
                      <p className="text-[11px] text-stone-600 italic bg-white p-2 rounded-lg border border-stone-200">
                        "{appt.problem_description}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
                      {/* One-Click Gmail Web Dispatch Button */}
                      <a
                        href={buildGmailWebUrl(appt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Invite via Gmail Web (1-Click)</span>
                      </a>

                      {/* Copy Link Button */}
                      <button
                        onClick={() => copyAppointmentInvite(appt)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 transition cursor-pointer"
                      >
                        {copiedId === appt.appointment_id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-600" />
                            <span>Copy Invitation Link & Message</span>
                          </>
                        )}
                      </button>

                      {appt.status !== 'confirmed' && (
                        <button
                          onClick={async () => {
                            try {
                              await api.simulateAcceptAppointment(appt.appointment_id);
                              await loadData();
                              alert(`✓ Dr. ${appt.expert_name || 'Doctor'} accepted! Automated telephone call dispatched to registered farmer mobile phone.`);
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                          <span>⚡ Auto-Accept & Trigger Real Phone Call to Farmer</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveCallAppt(appt)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Jitsi Video Consultation</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Verified Agricultural Experts Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 mb-1 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified Entomologists & Agronomists Directory</span>
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Direct access to ICAR scientists and university faculty specializing in southern Indian cropping systems.
            </p>

            <div className="space-y-4">
              {experts.map((exp) => (
                <div
                  key={exp.expert_id}
                  className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-400 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
                      {exp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-stone-900 text-base">{exp.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>ICAR Verified</span>
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">{exp.title} • {exp.institution}</div>
                      <div className="text-[11px] text-emerald-800 font-mono font-bold mt-1">
                        Email: {exp.email}
                      </div>
                      <div className="text-xs text-stone-600 mt-1 max-w-lg">
                        <strong>Specialization:</strong> {exp.specialization}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedExpert(exp);
                      setShowBookModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Consultation</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Video Conference Overlay */}
      {activeCallAppt && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col p-4 animate-fade-in">
          <div className="flex items-center justify-between text-white pb-3 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <div className="font-bold text-sm">
                  Live Consultation with {activeCallAppt.expert_name || 'Agronomist'}
                </div>
                <div className="text-xs text-stone-400">
                  Crop: {selectedField?.crop_type} • Encrypted Jitsi Peer Connection
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveCallAppt(null)}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Leave Consultation</span>
            </button>
          </div>

          <div className="flex-1 mt-3 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800">
            <iframe
              src={`https://meet.jit.si/${activeCallAppt.jitsi_room_id}#config.prejoinPageEnabled=false&userInfo.displayName=Farmer%20${encodeURIComponent(selectedField?.name || 'Ramesh')}`}
              allow="camera; microphone; fullscreen; display-capture"
              className="w-full h-full border-0"
              title="Jitsi Video Consultation"
            />
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Schedule Video Consultation</span>
              </h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-950 text-sm">{selectedExpert?.name}</div>
                <div className="text-emerald-800 text-[11px] font-mono mt-0.5">
                  Direct Email Invite: <strong>{selectedExpert?.email}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.appointment_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Preferred Time Window</label>
                  <select
                    value={bookingForm.appointment_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, appointment_time: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="09:30 AM">09:30 AM - 10:00 AM</option>
                    <option value="10:30 AM">10:30 AM - 11:00 AM</option>
                    <option value="11:30 AM">11:30 AM - 12:00 PM</option>
                    <option value="02:30 PM">02:30 PM - 03:00 PM</option>
                    <option value="04:00 PM">04:00 PM - 04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Describe Field Problem</label>
                <textarea
                  rows={3}
                  value={bookingForm.problem_description}
                  onChange={(e) => setBookingForm({ ...bookingForm, problem_description: e.target.value })}
                  placeholder="Whitefly surge, leafminer damage, observed wilting..."
                  className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {bookingLoading ? 'Dispatching Invite...' : 'Confirm & Dispatch Invite Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMTP Email Settings Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Doctor Email Dispatch Settings</span>
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-4 pt-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
                <strong>Automatic Zero-Click Dispatch:</strong> Enter your Gmail address and 16-character Google App Password below to allow background email delivery. Or use the <strong>"Send via Gmail Web (1-Click)"</strong> button on any appointment to send directly without credentials.
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Your Gmail Address:</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Google App Password (16 characters):</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Generate at myaccount.google.com &rarr; Security &rarr; 2-Step Verification &rarr; App passwords.
                </span>
              </div>

              {smtpStatus && (
                <div className="p-2 rounded-lg bg-stone-100 font-mono text-[11px] text-stone-800">
                  {smtpStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={smtpSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {smtpSaving ? 'Saving...' : 'Save SMTP Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
