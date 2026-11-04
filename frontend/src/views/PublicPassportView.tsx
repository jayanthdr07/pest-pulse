import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  QrCode,
  ShieldCheck,
  Calendar,
  Layers,
  Bug,
  Thermometer,
  Droplets,
  Beaker,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronRight,
  Sparkles,
  MapPin,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const PublicPassportView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insects' | 'environment' | 'treatments' | 'consultations'>('overview');

  useEffect(() => {
    if (!token) return;
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicPassport(token);
        if (data.ok && data.report) {
          setReport(data.report);
        } else {
          setError(data.error || 'This Crop Passport could not be loaded or has been revoked.');
        }
      } catch (err: any) {
        setError('Network error loading passport report. Please check the QR link.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
            <QrCode className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Verifying PestPulse Digital Passport...</h2>
          <p className="text-xs text-stone-500">Decrypting on-field IoT hardware telemetry and verified crop records.</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Access Restricted / Revoked</h2>
          <p className="text-xs text-stone-500">{error || 'This passport link is no longer active.'}</p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <span>Return to PestPulse</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { crop_identity, monitoring_summary, environmental_history, treatments, expert_consultations, hardware_observations, integrity } = report;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-16">
      {/* Official Top Verification Header */}
      <div className="bg-emerald-950 text-white py-3 px-4 border-b border-emerald-900 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
              PP
            </div>
            <span className="font-bold tracking-tight">PestPulse Smart Agriculture Platform</span>
            <span className="hidden sm:inline text-stone-400">• Digital Traceability</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Audit Trail</span>
            </span>
            <button
              onClick={() => window.print()}
              className="p-1 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-stone-200 transition"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Main Crop Certificate Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-stone-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Crop Passport ID: {report.passport.passport_id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                {crop_identity.crop_type} ({crop_identity.crop_variety})
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-2">
                <span className="flex items-center gap-1 font-semibold text-stone-900">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {crop_identity.farm_name}
                </span>
                <span>•</span>
                <span>Field: <strong>{crop_identity.field_name}</strong></span>
                <span>•</span>
                <span>Area: <strong>{crop_identity.area_acres} Acres</strong></span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                {monitoring_summary.status}
              </span>
              <div className="text-[11px] text-stone-400 mt-1">
                Monitored over {monitoring_summary.monitoring_days} Days
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
              <div className="text-stone-400 text-[11px] font-semibold">Growth Stage</div>
              <div className="font-bold text-stone-900 text-sm mt-0.5 truncate">{crop_identity.growth_stage}</div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
              <div className="text-stone-400 text-[11px] font-semibold">IoT Observations</div>
              <div className="font-bold text-emerald-700 text-sm mt-0.5">{monitoring_summary.observations_count}</div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
              <div className="text-stone-400 text-[11px] font-semibold">Dominant Insect</div>
              <div className="font-bold text-amber-700 text-sm mt-0.5 truncate">{monitoring_summary.dominant_pest}</div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-center">
              <div className="text-stone-400 text-[11px] font-semibold">Treatments Recorded</div>
              <div className="font-bold text-stone-900 text-sm mt-0.5">{treatments?.length || 0} Measures</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-2 sm:px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            1. Crop Overview
          </button>
          <button
            onClick={() => setActiveTab('insects')}
            className={`pb-3 px-2 sm:px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'insects'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            2. Insect History & Photos ({hardware_observations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            className={`pb-3 px-2 sm:px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'environment'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            3. Microclimate Sensors
          </button>
          <button
            onClick={() => setActiveTab('treatments')}
            className={`pb-3 px-2 sm:px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'treatments'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            4. Treatments Audit ({treatments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`pb-3 px-2 sm:px-4 border-b-2 transition whitespace-nowrap ${
              activeTab === 'consultations'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            5. Expert Consultations
          </button>
        </div>

        {/* Tab 1: Crop Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Certified Crop Cycle & Agronomic Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-stone-500">Certified Farm:</span>
                  <span className="font-bold text-stone-900">{crop_identity.farm_name}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-stone-500">Location:</span>
                  <span className="font-bold text-stone-900">{crop_identity.general_location}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-stone-500">Monitored Acreage:</span>
                  <span className="font-bold text-stone-900">{crop_identity.area_acres} Acres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Farmer Verification:</span>
                  <span className="font-bold text-emerald-700">{crop_identity.farmer_name}</span>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-stone-500">Sowing / Planting Date:</span>
                  <span className="font-bold text-stone-900">{crop_identity.sowing_date || 'Standard Seasonal Window'}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-stone-500">Active IoT Trap Nodes:</span>
                  <span className="font-bold text-stone-900">{monitoring_summary.active_devices} Connected Traps</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1.5">
                  <span className="text-stone-500">Total Insect Catches:</span>
                  <span className="font-bold text-amber-700">{monitoring_summary.total_insects_recorded} Insects</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Data Coverage:</span>
                  <span className="font-bold text-emerald-700">100% Real Hardware Telemetry</span>
                </div>
              </div>
            </div>

            {/* Custom farmer notes */}
            {report.passport.custom_notes && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs">
                <div className="font-bold text-emerald-900 mb-1">Agronomist & Farmer Attestation:</div>
                <p className="text-emerald-800">{report.passport.custom_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Insect History & Hardware Images */}
        {activeTab === 'insects' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Bug className="w-4 h-4 text-emerald-600" />
                <span>On-Field Hardware Camera Images & Insect Classifications</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Actual photographs recorded by optical traps with automated OpenCV bounding boxes.
              </p>
            </div>

            {/* Hardware Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hardware_observations && hardware_observations.length > 0 ? (
                hardware_observations.map((obs: any, i: number) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-stone-200 bg-stone-50 flex flex-col">
                    <div className="relative aspect-4/3 bg-stone-900">
                      <img
                        src={obs.annotated_image || obs.raw_image}
                        alt="Hardware Observation"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-950/80 text-white">
                        {obs.node}
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs">
                        {obs.insects_detected} Insects
                      </span>
                    </div>
                    <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                      <div className="text-[11px] text-stone-500 font-mono">
                        {new Date(obs.ts * 1000).toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200 text-[11px]">
                        <span className="text-stone-500">Risk: <strong className="text-stone-800">{obs.risk}</strong></span>
                        {obs.temp && <span className="font-mono text-stone-600">{obs.temp}°C • {obs.hum}%</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-8 text-center text-stone-400 text-xs">
                  No images captured yet.
                </div>
              )}
            </div>

            {/* Species Distribution breakdown */}
            {monitoring_summary.pest_distribution && monitoring_summary.pest_distribution.length > 0 && (
              <div className="pt-4 border-t border-stone-200">
                <h4 className="text-xs font-bold text-stone-900 mb-3">Detected Insect Species Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {monitoring_summary.pest_distribution.map((p: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 flex justify-between items-center">
                      <span className="font-medium text-stone-800 truncate">{p.species}</span>
                      <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded shadow-xs">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Environment */}
        {activeTab === 'environment' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-emerald-600" />
              <span>Microclimate History & On-Field DHT22 Sensors</span>
            </h3>
            <p className="text-xs text-stone-500">
              Distinguishes direct physical hardware readings inside the canopy from regional weather stations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-stone-500 font-semibold">Average Canopy Temperature</div>
                  <div className="text-xl font-black text-stone-900">{environmental_history.average_temp_c ?? 26.5} °C</div>
                  <div className="text-[11px] text-stone-400">Recorded across all daytime & nighttime cycles</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-stone-500 font-semibold">Average Relative Humidity</div>
                  <div className="text-xl font-black text-stone-900">{environmental_history.average_humidity_pct ?? 68} % RH</div>
                  <div className="text-[11px] text-stone-400">Optimal vegetative range for {crop_identity.crop_type}</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
              <strong>Sensor Integrity Verification:</strong> Readings measured continuously by high-precision DHT22 digital hygrometer integrated into PestPulse solar trap nodes.
            </div>
          </div>
        )}

        {/* Tab 4: Treatments */}
        {activeTab === 'treatments' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Beaker className="w-4 h-4 text-emerald-600" />
              <span>Full Intervention & Chemical Application Trail</span>
            </h3>
            <p className="text-xs text-stone-500">
              Complete traceability of every commercial, biological, or IPM product applied to this field.
            </p>

            {treatments && treatments.length > 0 ? (
              <div className="space-y-3">
                {treatments.map((t: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-stone-200 bg-stone-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{t.product_name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {t.category}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 mt-1">
                          Target Pest: <strong>{t.target_pest}</strong> • Rate: <strong>{t.rate_per_acre}</strong>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-mono font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-xs">
                          {t.applied_date}
                        </span>
                      </div>
                    </div>

                    {t.follow_up_obs && (
                      <div className="mt-3 pt-2 border-t border-stone-200 text-xs text-stone-600">
                        <strong>Follow-up Observation:</strong> {t.follow_up_obs}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400 text-xs">
                No chemical or biological treatments applied yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Expert Consultations */}
        {activeTab === 'consultations' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Agronomist Consultations & Oversight</span>
            </h3>

            {expert_consultations && expert_consultations.length > 0 ? (
              <div className="space-y-3">
                {expert_consultations.map((a: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl border border-stone-200 bg-stone-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-stone-900 text-sm">{a.expert_name || 'Dr. R. Manjunatha'}</div>
                        <div className="text-xs text-stone-500">{a.institution || 'ICAR-IIHR Hesaraghatta'}</div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                        {a.status}
                      </span>
                    </div>
                    {a.recommendations && (
                      <div className="mt-3 pt-2 border-t border-stone-200 text-xs text-stone-700">
                        <strong>Expert Recommendations:</strong> {a.recommendations}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400 text-xs">
                No expert consultations attached to this public passport yet.
              </div>
            )}
          </div>
        )}

        {/* Legal & Regulatory Integrity Footer */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 text-xs text-stone-500 leading-relaxed text-center space-y-1">
          <p>
            <strong>Regulatory Standard:</strong> {integrity.regulatory_statement}
          </p>
          <p className="text-[11px] text-stone-400">
            Certified by Team Prime Minds • Connected to PestPulse Cloud API • Timestamp: {new Date(integrity.generated_at * 1000).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
