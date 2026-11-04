import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Cpu,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Clock,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Radio,
  FileCode,
  Layers,
  Save,
  Sliders,
} from 'lucide-react';
import { api } from '../services/api';
import { Device } from '../types';

export const DevicesView: React.FC = () => {
  const { fields, selectedField, t, language } = useApp();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Configuration editing form state
  const [editName, setEditName] = useState('');
  const [editInterval, setEditInterval] = useState('1800');
  const [editTrap, setEditTrap] = useState('sticky_yellow');
  const [editPest, setEditPest] = useState('whitefly');
  const [editFieldId, setEditFieldId] = useState('');

  useEffect(() => {
    loadDevices();
  }, [selectedField?.field_id]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await api.getDevices(selectedField?.field_id);
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        populateEdit(data[0]);
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateEdit = (d: Device) => {
    setSelectedDevice(d);
    setEditName(d.name);
    setEditInterval(String(d.interval_s || 1800));
    setEditTrap(d.trap || 'sticky_yellow');
    setEditPest(d.pest || 'whitefly');
    setEditFieldId(d.field_id || 'field_001');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    try {
      setSaving(true);
      const updated = await api.updateTrap(selectedDevice.node, {
        name: editName,
        interval_s: parseInt(editInterval) || 1800,
        trap: editTrap,
        pest: editPest,
        field_id: editFieldId,
      });
      alert(`Trap ${selectedDevice.node} updated. Changes will be fetched by ESP32 on next upload cycle.`);
      await loadDevices();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to update device configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-emerald-600" />
          <span>IoT Hardware Nodes & Device Management</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          {language === 'kn'
            ? 'ಹೊಲದಲ್ಲಿರುವ ESP32-CAM ಸ್ಮಾರ್ಟ್ ಬಲೆಗಳು, ಬ್ಯಾಟರಿ ಸ್ಥಿತಿ ಮತ್ತು ದೂರಸ್ಥ ಕಾನ್ಫಿಗರೇಶನ್'
            : 'Configure ESP32-CAM optical trap nodes, upload intervals, telemetry health, and field associations'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Devices Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-stone-900">
              Registered Hardware Traps ({devices.length})
            </h2>
            <button
              onClick={loadDevices}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-stone-500">Checking device pings...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((d) => {
                const isSelected = selectedDevice?.node === d.node;
                const isOnline = d.online;
                const fieldObj = fields.find((f) => f.field_id === d.field_id);

                return (
                  <div
                    key={d.node}
                    onClick={() => populateEdit(d)}
                    className={`bg-white rounded-2xl p-5 border shadow-sm cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/15'
                        : 'border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'
                          }`}>
                            <Cpu className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-stone-900">{d.name}</h3>
                            <span className="font-mono text-[10px] text-stone-400">{d.node}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
                          <span>{isOnline ? t('device_online') : t('device_offline')}</span>
                        </span>
                      </div>

                      {/* Telemetry info */}
                      <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 text-xs border border-stone-100 mb-3">
                        <div className="flex justify-between">
                          <span className="text-stone-500">Field:</span>
                          <span className="font-semibold text-stone-800">{fieldObj?.name || 'Polyhouse'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Trap Type:</span>
                          <span className="font-medium text-stone-700">{d.trap}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Target Pest:</span>
                          <span className="font-bold text-emerald-800">{d.pest_en || d.pest}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">Photo Interval:</span>
                          <span className="font-mono text-stone-700">{Math.round(d.interval_s / 60)} min</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                          <span className="text-[10px] text-stone-400 block">Battery</span>
                          <span className="font-extrabold text-stone-900">{d.battery_pct || 92}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                          <span className="text-[10px] text-stone-400 block">Solar</span>
                          <span className="font-extrabold text-emerald-700">Charging</span>
                        </div>
                        <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                          <span className="text-[10px] text-stone-400 block">Signal</span>
                          <span className="font-mono font-bold text-stone-900">{d.rssi || -62} dBm</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                      <span>FW: {d.fw || '1.1.0'}</span>
                      <span className="text-emerald-700 font-bold">Configure Node →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Firmware & Hardware Ingestion Guide */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-stone-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>ESP32-CAM Ingestion Endpoint Protocol</span>
            </h3>
            <p className="text-stone-600 leading-relaxed">
              Hardware sends JPEG photos and DHT22 telemetry via HTTPS POST to <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-900">/api/v1/ingest</code> with header <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-900">X-Device-Key</code>.
            </p>
            <div className="p-3 bg-stone-900 text-stone-200 rounded-xl font-mono text-[11px] overflow-x-auto">
              curl -X POST "http://localhost:8080/api/v1/ingest?node=trap1&trap=sticky_yellow&temp=28.5&hum=65&battery=92" \<br />
              &nbsp;&nbsp;-H "X-Device-Key: change-me-device-key" \<br />
              &nbsp;&nbsp;-H "Content-Type: image/jpeg" \<br />
              &nbsp;&nbsp;--data-binary "@test_card.jpg"
            </div>
          </div>
        </div>

        {/* Right 1 Col: Remote Configuration Panel */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm h-fit space-y-4 text-xs">
          <div className="pb-3 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">Remote Node Configuration</h2>
              <p className="text-[11px] text-stone-500">Node: {selectedDevice?.node || 'trap1'}</p>
            </div>
            <Sliders className="w-4 h-4 text-emerald-600" />
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Friendly Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Assign to Field</label>
              <select
                value={editFieldId}
                onChange={(e) => setEditFieldId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {fields.map((f) => (
                  <option key={f.field_id} value={f.field_id}>
                    {f.name} ({f.crop_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Optical Trap Type</label>
              <select
                value={editTrap}
                onChange={(e) => setEditTrap(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="sticky_yellow">Yellow Sticky Card (Whitefly / Thrips)</option>
                <option value="pheromone">Pheromone Funnel Trap (Fruit Borer)</option>
                <option value="tuta_delta">Tuta Delta White Trap (Pinworm)</option>
                <option value="lirio_sticky">Liriomyza Sticky Card (Leaf Miner)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Monitored Target Pest</label>
              <select
                value={editPest}
                onChange={(e) => setEditPest(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="whitefly">Whitefly (Bemisia tabaci)</option>
                <option value="fruit_borer">Fruit Borer (Helicoverpa armigera)</option>
                <option value="tuta">Tomato Pinworm (Tuta absoluta)</option>
                <option value="leafminer">Serpentine Leaf Miner (Liriomyza)</option>
                <option value="thrips">Chilli Thrips (Scirtothrips dorsalis)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Capture Interval</label>
              <select
                value={editInterval}
                onChange={(e) => setEditInterval(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="60">1 minute (Lab testing)</option>
                <option value="300">5 minutes (Fast demo)</option>
                <option value="900">15 minutes</option>
                <option value="1800">30 minutes (Standard field)</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hours (Battery saver)</option>
              </select>
              <p className="text-[10px] text-stone-400 mt-1">
                Node fetches this interval on its next upload cycle.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Transmitting Config...' : 'Apply Remote Configuration'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
