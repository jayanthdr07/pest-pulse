import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  QrCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Calendar,
  Sparkles,
  ExternalLink,
  Printer,
  FileText,
  AlertTriangle,
  Beaker,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  Clock,
  Eye,
} from 'lucide-react';

export const CropPassportView: React.FC = () => {
  const { selectedField, fields, setSelectedField, language, t } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [passportData, setPassportData] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [showAddTreatment, setShowAddTreatment] = useState<boolean>(false);
  const [savingTreatment, setSavingTreatment] = useState<boolean>(false);

  // New treatment form state
  const [treatmentForm, setTreatmentForm] = useState({
    target_pest: 'Tomato Leafminer (Tuta absoluta)',
    product_name: '',
    category: 'Botanical',
    active_ingredient: '',
    application_method: 'Foliar spray',
    rate_per_acre: '600 ml/acre',
    total_quantity: '1.5 Liters',
    water_volume_liters: 500,
    applied_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    notes: '',
  });

  const loadData = async () => {
    if (!selectedField) return;
    try {
      setLoading(true);
      const [passRes, treatRes] = await Promise.all([
        api.getPassport(selectedField.field_id),
        api.getTreatments(selectedField.field_id),
      ]);
      if (passRes.ok) {
        setPassportData(passRes.passport);
        setReport(passRes.report);
      }
      if (treatRes.ok) {
        setTreatments(treatRes.treatments);
      }
    } catch (err) {
      console.error('Failed to load crop passport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedField?.field_id]);

  const handleCopyLink = () => {
    if (!report?.passport?.passport_url) return;
    navigator.clipboard.writeText(report.passport.passport_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!report?.passport?.qr_data_url) return;
    const a = document.createElement('a');
    a.href = report.passport.qr_data_url;
    a.download = `pestpulse_qr_${selectedField?.crop_type || 'field'}.png`;
    a.click();
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleRegenerateToken = async () => {
    if (!passportData?.passport_id) return;
    if (!confirm('Are you sure you want to regenerate the QR access token? Existing QR codes and printed stickers will stop working.')) return;
    try {
      setLoading(true);
      await api.regeneratePassportToken(passportData.passport_id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRevoke = async () => {
    if (!passportData?.passport_id) return;
    try {
      setLoading(true);
      if (passportData.is_revoked) {
        await api.updatePassportSettings(passportData.passport_id, { is_revoked: 0 });
      } else {
        await api.revokePassport(passportData.passport_id);
      }
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccessType = async (accessType: 'summary' | 'detailed' | 'private') => {
    if (!passportData?.passport_id) return;
    try {
      await api.updatePassportSettings(passportData.passport_id, { access_type: accessType });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTreatmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField) return;
    try {
      setSavingTreatment(true);
      await api.createTreatment({
        field_id: selectedField.field_id,
        ...treatmentForm,
      });
      setShowAddTreatment(false);
      setTreatmentForm({
        target_pest: '',
        product_name: '',
        category: 'Chemical',
        active_ingredient: '',
        application_method: 'Foliar spray',
        rate_per_acre: '',
        total_quantity: '',
        water_volume_liters: 400,
        applied_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        notes: '',
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTreatment(false);
    }
  };

  if (!selectedField) {
    return (
      <div className="p-8 text-center text-stone-500">
        Please select a field from the sidebar to view its Crop Passport.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" />
            <span>PestPulse Crop Passport & Certified Traceability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {language === 'kn' ? 'ಡಿಜಿಟಲ್ ಬೆಳೆ ಪಾಸ್‌ಪೋರ್ಟ್' : 'Digital Crop Passport'}
          </h1>
          <p className="text-sm text-stone-300 mt-1 max-w-2xl">
            {language === 'kn'
              ? 'ಪ್ರತಿಯೊಂದು ಬೆಳೆ ಹಂತ, ಕೀಟ ನಿಗಾ ಇತಿಹಾಸ, ತಾಪಮಾನ/ಆರ್ದ್ರತೆ ದಾಖಲೆಗಳು ಮತ್ತು ಸಿಂಪಡಣೆ ವಿವರಗಳ ಅಧಿಕೃತ ಕ್ಯೂಆರ್ ರಿಪೋರ್ಟ್.'
              : 'Certified tamper-resistant audit trail linking field IoT sensors, AI insect counts, and verified chemical/biological treatments.'}
          </p>
        </div>

        {/* Quick Field Pill */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs">
          <div className="text-stone-300 font-semibold mb-1">Selected Field:</div>
          <div className="font-bold text-white text-sm">{selectedField.name}</div>
          <div className="text-emerald-300 font-mono text-[11px]">
            {selectedField.crop_type} • {selectedField.area_acres} Acres
          </div>
        </div>
      </div>

      {loading && !report ? (
        <div className="flex items-center justify-center py-20 text-emerald-600 font-bold gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Compiling certified Crop Passport & generating QR code...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: QR Code & Access Controls */}
          <div className="space-y-6">
            {/* QR Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                <span>PestPulse Verified QR Code</span>
              </div>

              {/* QR Image */}
              <div className="bg-stone-50 p-4 rounded-2xl border-2 border-dashed border-emerald-300 inline-block shadow-inner">
                {report?.passport?.qr_data_url ? (
                  <img
                    src={report.passport.qr_data_url}
                    alt="PestPulse QR Code"
                    className="w-56 h-56 mx-auto object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-stone-400">QR Loading...</div>
                )}
              </div>

              {/* Token & Scan Instructions */}
              <div className="mt-4">
                <div className="text-xs text-stone-500 font-mono truncate">
                  Token: <strong>{report?.passport?.token}</strong>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Scan using any phone camera to view the visitor report without installing the app.
                </p>
                <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Viewed {passportData?.views_count || 0} times by agricultural officers & buyers</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-5">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={handlePrintPDF}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-900 text-white transition col-span-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print PDF Report</span>
                </button>
              </div>

              {/* Open Visitor Preview Link */}
              {report?.passport?.passport_url && (
                <a
                  href={report.passport.passport_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <span>Open Public Visitor View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Privacy & Access Settings Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
              <h3 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>QR Security & Privacy Controls</span>
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Control what information is shared when a visitor scans this field's QR sticker.
              </p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="access_type"
                    checked={passportData?.access_type === 'detailed'}
                    onChange={() => handleUpdateAccessType('detailed')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-stone-800">Shareable Detailed Report (Recommended)</div>
                    <div className="text-[11px] text-stone-500">
                      Shows full pest counts, sensor graphs, treatments, and ICAR consultation notes.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="access_type"
                    checked={passportData?.access_type === 'summary'}
                    onChange={() => handleUpdateAccessType('summary')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-stone-800">Public Summary</div>
                    <div className="text-[11px] text-stone-500">
                      Hides specific chemical doses and farmer contact; shows only high-level health status.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="access_type"
                    checked={passportData?.access_type === 'private'}
                    onChange={() => handleUpdateAccessType('private')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-stone-800">Private (Disabled)</div>
                    <div className="text-[11px] text-stone-500">
                      Scanning the QR will show an access restricted screen.
                    </div>
                  </div>
                </label>
              </div>

              {/* Revoke / Regenerate Token */}
              <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between gap-2">
                <button
                  onClick={handleRegenerateToken}
                  className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1.5"
                  title="Generate a new unpredictable token and invalidate old QR code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate Token</span>
                </button>

                <button
                  onClick={handleToggleRevoke}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition ${
                    passportData?.is_revoked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  }`}
                >
                  {passportData?.is_revoked ? 'Restore Access' : 'Revoke Access'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Columns: Passport Sections & Treatment History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section A: Crop Identity & Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                <h3 className="font-bold text-stone-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Crop Identity & Monitoring Dossier</span>
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Active Monitoring
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="text-stone-400 font-medium">Crop & Variety</div>
                  <div className="font-bold text-stone-900 text-sm mt-0.5">
                    {report?.crop_identity?.crop_type}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">
                    {report?.crop_identity?.crop_variety}
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="text-stone-400 font-medium">Growth Stage</div>
                  <div className="font-bold text-stone-900 text-sm mt-0.5">
                    {report?.crop_identity?.growth_stage}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Area: {report?.crop_identity?.area_acres} Acres
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="text-stone-400 font-medium">Hardware Readings</div>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">
                    {report?.monitoring_summary?.observations_count} Observations
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Over {report?.monitoring_summary?.monitoring_days} Days
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="text-stone-400 font-medium">Dominant Pest</div>
                  <div className="font-bold text-amber-700 text-sm mt-0.5 truncate">
                    {report?.monitoring_summary?.dominant_pest}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {report?.monitoring_summary?.total_insects_recorded} Total Detected
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Treatment & Intervention Audit Trail */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-stone-900 flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-emerald-600" />
                    <span>Intervention & Treatment Audit Trail</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Verified record of all applied chemical, botanical, and IPM bio-control measures.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTreatment(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Treatment</span>
                </button>
              </div>

              {treatments.length === 0 ? (
                <div className="p-6 text-center text-stone-400 text-xs border-2 border-dashed border-stone-200 rounded-xl">
                  No treatments recorded for this field yet. Click <strong>"Record Treatment"</strong> after spraying.
                </div>
              ) : (
                <div className="space-y-3">
                  {treatments.map((tRec) => (
                    <div
                      key={tRec.treatment_id}
                      className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{tRec.product_name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {tRec.category}
                            </span>
                            <span className="text-[11px] text-stone-400 font-mono">
                              Applied: {tRec.applied_date}
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 mt-1">
                            Target Pest: <strong className="text-stone-800">{tRec.target_pest}</strong>
                            {tRec.active_ingredient && <span> • Active: {tRec.active_ingredient}</span>}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-stone-700 border border-stone-200 shadow-xs">
                            {tRec.rate_per_acre || 'Standard Dose'}
                          </span>
                        </div>
                      </div>

                      {/* Follow-up efficacy observation */}
                      {tRec.follow_up_obs && (
                        <div className="mt-2.5 pt-2 border-t border-stone-200/80 text-xs flex items-start gap-1.5 text-stone-600">
                          <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Post-Treatment Observation:</strong> {tRec.follow_up_obs}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section C: Actual Camera Captures from Hardware */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
              <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Verified Hardware Optical Captures</span>
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Photographs transmitted directly from field ESP32-CAM nodes with OpenCV bounding boxes.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {report?.hardware_observations?.slice(0, 4).map((obs: any, i: number) => (
                  <div key={i} className="group relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img
                      src={obs.annotated_image || obs.raw_image}
                      alt="Capture"
                      className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-stone-950/70 backdrop-blur-xs p-1.5 text-white text-[10px]">
                      <div className="font-bold truncate">{obs.node}</div>
                      <div className="text-emerald-400 font-mono">{obs.insects_detected} detected</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal / Traceability Integrity Note */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              <strong>PestPulse Traceability Standard:</strong> {report?.integrity?.regulatory_statement}
              <div className="text-[11px] text-emerald-700 mt-1 font-mono">
                Data pipeline: {report?.integrity?.data_source} • Generated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Treatment Modal */}
      {showAddTreatment && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Beaker className="w-5 h-5 text-emerald-600" />
                <span>Record New Crop Treatment</span>
              </h3>
              <button
                onClick={() => setShowAddTreatment(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTreatmentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Target Pest *</label>
                  <input
                    type="text"
                    required
                    value={treatmentForm.target_pest}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, target_pest: e.target.value })}
                    placeholder="e.g. Tomato Leafminer"
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={treatmentForm.product_name}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, product_name: e.target.value })}
                    placeholder="e.g. Neem Baan 10000 ppm"
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Product Category</label>
                  <select
                    value={treatmentForm.category}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, category: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Botanical">Botanical (Neem, etc.)</option>
                    <option value="Chemical">Chemical (Synthetic)</option>
                    <option value="Bio-pesticide">Bio-pesticide (Trichoderma, Bt)</option>
                    <option value="Pheromone">Pheromone Lure Trap</option>
                    <option value="Cultural">Cultural / Physical Barrier</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Active Ingredient</label>
                  <input
                    type="text"
                    value={treatmentForm.active_ingredient}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, active_ingredient: e.target.value })}
                    placeholder="e.g. Azadirachtin 1%"
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Dosage / Rate</label>
                  <input
                    type="text"
                    value={treatmentForm.rate_per_acre}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, rate_per_acre: e.target.value })}
                    placeholder="e.g. 600 ml/acre"
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Water Carrier</label>
                  <input
                    type="number"
                    value={treatmentForm.water_volume_liters}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, water_volume_liters: Number(e.target.value) })}
                    placeholder="Litres"
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Application Date</label>
                  <input
                    type="date"
                    required
                    value={treatmentForm.applied_date}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, applied_date: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Field Observation / Notes</label>
                <textarea
                  rows={2}
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                  placeholder="e.g. Applied in evening with motorized sprayer. Checked nozzle pressure."
                  className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddTreatment(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTreatment}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50"
                >
                  {savingTreatment ? 'Saving Record...' : 'Confirm & Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
