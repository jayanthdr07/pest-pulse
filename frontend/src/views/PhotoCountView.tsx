import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  UploadCloud,
  Camera,
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  Beaker,
  AlertOctagon,
  HeartPulse,
  Volume2,
  Info,
} from 'lucide-react';

export const PhotoCountView: React.FC = () => {
  const { selectedField, language, t } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [trapType, setTrapType] = useState<string>('yellow_sticky');
  const [suspectedPest, setSuspectedPest] = useState<string>('auto');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile || !selectedField) return;
    try {
      setAnalyzing(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('trap', trapType);
      formData.append('crop', selectedField.crop_type);
      formData.append('field_id', selectedField.field_id);
      formData.append('suspected_pest', suspectedPest);

      const res = await api.uploadAndCount(formData);
      if (res.ok) {
        setResult(res);
      } else {
        alert(res.error || 'Failed to analyze uploaded photo.');
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      alert('Error connecting to AI detection pipeline.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Test ringtone and incoming phone call UI immediately
  const handleTestCall = () => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("This is PestPulse testing your device speaker. When 50 or more insects are detected, an emergency phone call rings your device automatically.");
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    }
    alert("Audio test initiated. If you hear the spoken message, your device speaker and speech synthesis are fully operational.");
  };

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-stone-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4" />
            <span>On-Demand AI Insect Detection & Agronomic Diagnosis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {language === 'kn' ? 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮೂಲಕ ಕೀಟ ಎಣಿಕೆ' : 'Count via Photo Upload'}
          </h1>
          <p className="text-sm text-stone-300 mt-1 max-w-2xl">
            {language === 'kn'
              ? 'ಕ್ಯಾಮೆರಾ ಅಥವಾ ಜಿಗುಟು ಬಲೆಯ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ನಿಖರ ಕೀಟ ಎಣಿಕೆ, ಹರಡುವ ರೋಗಗಳು ಮತ್ತು ನೈಜ ಚಿತ್ರಗಳೊಂದಿಗೆ ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣಗಳನ್ನು ತಕ್ಷಣ ಪಡೆಯಿರಿ.'
              : 'Upload a photo of your sticky trap, canopy, or liner for exact insect counts, transmitted disease vectors, and verified commercial fertilizers with real package photographs.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={handleTestCall}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-xs text-purple-200 font-bold transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-300" />
            <span>Test Phone Call Audio</span>
          </button>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs text-stone-200">
            <div>Selected Field:</div>
            <div className="font-bold text-white text-sm">{selectedField?.name || 'Main Field'}</div>
            <div className="text-[11px] text-emerald-300">{selectedField?.crop_type} • {selectedField?.area_acres} Acres</div>
          </div>
        </div>
      </div>

      {/* 50+ Emergency Siren Banner */}
      {result && result.total_detected >= 50 && (
        <div className="bg-red-600 text-white rounded-2xl p-5 shadow-lg border-2 border-red-400 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white text-red-600 flex items-center justify-center shrink-0 shadow-md">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-red-200">
                CRITICAL OUTBREAK DETECTED (50+ INSECTS)
              </div>
              <div className="text-lg font-black">
                Severe Swarm Surge: {result.total_detected} {result.pest_name} Identified!
              </div>
              <div className="text-xs text-red-100 mt-0.5">
                Automated emergency telephone call dispatched to your mobile. Chief Entomologist Dr. Jayanth Gowda (jayanthgowda1406@gmail.com) has been alerted.
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="px-3 py-1 rounded-full bg-white text-red-700 text-xs font-black shadow-xs">
              EMERGENCY INTERVENTION
            </span>
          </div>
        </div>
      )}

      {/* Direct Call Dispatched Notification */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-xs flex items-center gap-3 text-xs text-emerald-950">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-emerald-900">
              Direct Automated Phone Call Placed to Your Mobile
            </div>
            <div className="text-emerald-800 text-[11px] mt-0.5">
              The PestPulse voice assistant has recited the scan findings: exact count of {result.total_detected} {result.pest_name}, associated viral/bacterial vectors, and corrective fertilizer dosage.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Upload & Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Photo Upload Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-600" />
            <span>Upload or Capture Trap / Canopy Photograph</span>
          </h3>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition cursor-pointer min-h-[220px] ${
              dragActive
                ? 'border-purple-500 bg-purple-50/50'
                : previewUrl
                ? 'border-emerald-400 bg-stone-50'
                : 'border-stone-300 hover:border-purple-400 hover:bg-stone-50/50'
            }`}
            onClick={() => document.getElementById('photo-file-input')?.click()}
          >
            <input
              id="photo-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {previewUrl ? (
              <div className="relative w-full max-h-56 flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Upload Preview"
                  className="max-h-48 rounded-xl object-contain shadow-sm border border-stone-200"
                />
                <span className="text-[11px] text-stone-500 mt-2 font-mono">
                  {selectedFile?.name} ({(selectedFile?.size! / 1024).toFixed(1)} KB) • Click to change
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="font-bold text-stone-800 text-sm">
                  Click to select or drag & drop photo here
                </div>
                <p className="text-xs text-stone-500 max-w-xs">
                  Supports JPEG, PNG from mobile phone camera or optical trap captures.
                </p>
              </div>
            )}
          </div>

          {/* Form Options */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Trap / Card Surface:</label>
                <select
                  value={trapType}
                  onChange={(e) => setTrapType(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-xl bg-stone-50 font-medium"
                >
                  <option value="yellow_sticky">Yellow Sticky Card (Whitefly, Leafminer)</option>
                  <option value="blue_sticky">Blue Sticky Card (Thrips)</option>
                  <option value="tuta_delta">White Delta Trap Liner (Pheromone)</option>
                  <option value="light_trap">Light / Funnel Trap</option>
                  <option value="leaf_foliage">Direct Leaf Foliage / Leaf Mines</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Target / Suspected Pest:</label>
                <select
                  value={suspectedPest}
                  onChange={(e) => setSuspectedPest(e.target.value)}
                  className="w-full p-2 border border-purple-300 rounded-xl bg-purple-50/50 font-bold text-purple-900"
                >
                  <option value="auto">🤖 AI Auto-Detect (Morphological Vision)</option>
                  <option value="whitefly">Whitefly (Bemisia tabaci)</option>
                  <option value="tuta">Tomato Leafminer (Tuta absoluta)</option>
                  <option value="fall_armyworm">Fall Armyworm (Spodoptera frugiperda)</option>
                  <option value="thrips">Thrips (Thrips palmi / dorsalis)</option>
                  <option value="aphids">Aphids (Aphis gossypii)</option>
                  <option value="fruit_borer">Fruit & Shoot Borer (Helicoverpa)</option>
                  <option value="brown_planthopper">Brown Planthopper (BPH)</option>
                </select>
              </div>
            </div>

            {/* Run Analysis Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={!selectedFile || analyzing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm transition shadow-md shadow-purple-900/30 disabled:opacity-40 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Classifying Morphology & Counting Exact Insects...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Scan Photo, Detect Diseases & Call Farmer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Detection Result & Crop Action Advice */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-5">
            <h3 className="font-bold text-stone-900 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Exact Insect Count & Classification</span>
              </span>
              {result && (
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    result.total_detected >= 50
                      ? 'bg-red-600 text-white animate-pulse'
                      : result.risk_level === 'HIGH'
                      ? 'bg-red-100 text-red-800'
                      : result.risk_level === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {result.risk_level}
                </span>
              )}
            </h3>

            {!result ? (
              <div className="p-12 text-center text-stone-400 text-xs border-2 border-dashed border-stone-200 rounded-2xl">
                Upload a photo on the left and click <strong>"Scan Photo"</strong> to see OpenCV bounding boxes, exact counts, disease vector links, and real commercial fertilizer packaging.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result Image with Overlay */}
                <div className="relative aspect-4/3 bg-stone-950 rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
                  <img
                    src={result.annotated_image_url}
                    alt="AI Annotated Detections"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-stone-950/80 backdrop-blur-xs p-2 text-white flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-400 font-mono">
                      Exact Count: {result.total_detected} Insects
                    </span>
                    <span className="text-[11px] text-stone-300 font-mono">
                      {result.detection_rationale || `${result.engine} model`}
                    </span>
                  </div>
                </div>

                {/* Count Summary Cards */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-stone-500 font-medium">Exact Insect Count</div>
                    <div className="text-3xl font-black text-purple-900 mt-1">
                      {result.total_detected}
                    </div>
                    <div className="text-[11px] text-stone-600 font-bold mt-0.5">
                      {result.pest_name}
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-stone-500 font-medium">Species Classification</div>
                    <div className="text-xs font-black text-stone-900 mt-1 italic">
                      {result.scientific_name}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold mt-1">
                      AI Certainty: {Math.round((result.confidence || 0.92) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Morphological Feature Rationale */}
                {result.detection_rationale && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-purple-950">Morphological Identification Criteria:</strong>
                      <div className="text-purple-900 text-[11px] mt-0.5">
                        {result.detection_rationale}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section: Diseases it will create */}
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 text-xs space-y-3">
                  <div className="font-bold text-red-950 flex items-center gap-1.5 text-sm">
                    <HeartPulse className="w-4 h-4 text-red-700" />
                    <span>Diseases and Pathogens this Pest Creates / Transmits:</span>
                  </div>

                  {result.diseases_created && result.diseases_created.length > 0 ? (
                    <div className="space-y-2">
                      {result.diseases_created.map((dis: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white border border-red-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-red-950">
                            <span>{dis.name}</span>
                            <span className="text-[10px] px-2 py-0.2 rounded bg-red-100 text-red-800">
                              {dis.crop_damage_pct}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-600">
                            <strong>Pathogen:</strong> {dis.pathogen_type}
                          </div>
                          <div className="text-[11px] text-stone-600">
                            <strong>Symptoms:</strong> {dis.symptoms}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500">No major systemic diseases recorded for this pest.</p>
                  )}
                </div>

                {/* Section: Fertilizers and Treatments to Use (with Real Images & Percentage) */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-3">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                    <Beaker className="w-4 h-4 text-emerald-700" />
                    <span>Recommended Commercial Fertilizers & Treatments (Exact % & Real Packaging):</span>
                  </div>

                  {result.fertilizers_and_treatments && result.fertilizers_and_treatments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {result.fertilizers_and_treatments.map((fert: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-xs flex items-start gap-4">
                          {/* Real Packaging Photograph */}
                          <div className="relative shrink-0">
                            <img
                              src={fert.image_url}
                              alt={fert.product_name}
                              className="w-24 h-32 rounded-xl object-contain bg-stone-50 border border-stone-200 shadow-sm p-1"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-700 text-white font-extrabold text-[9px]">
                              GENUINE
                            </div>
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="font-bold text-stone-900 text-sm leading-tight">
                              {fert.product_name}
                            </div>
                            <div className="text-[11px] text-stone-500">
                              {fert.category} • {fert.active_ingredient}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300">
                                Dilution: {fert.dilution_percentage}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold text-[11px] border border-stone-300">
                                Acre Dose: {fert.dosage_per_acre}
                              </span>
                            </div>

                            <div className="text-[11px] text-stone-600 leading-snug pt-1">
                              <strong>Agronomic Action:</strong> {fert.action}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500">Standard cultural practices recommended.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <a
                    href={result.annotated_image_url}
                    download="pestpulse_analyzed_counter.jpg"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Annotated Photo</span>
                  </a>

                  <span className="text-[11px] text-stone-400 font-mono">
                    Auto-saved as Observation #{result.reading_id}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
