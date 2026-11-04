import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Camera,
  Thermometer,
  Droplets,
  BatteryCharging,
  RefreshCw,
  Eye,
  Download,
  Filter,
  Calendar,
  Radio,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { RiskPill } from '../components/ui/RiskPill';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

export const TrapGalleryView: React.FC = () => {
  const { selectedField, language } = useApp();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterNode, setFilterNode] = useState<string>('all');
  const [activeModalImg, setActiveModalImg] = useState<any>(null);
  const [showRawMap, setShowRawMap] = useState<Record<number, boolean>>({});

  const loadGallery = async () => {
    try {
      setLoading(true);
      const res = await api.getTrapImages({
        field_id: selectedField?.field_id,
        limit: 50,
      });
      if (res.ok) {
        setImages(res.images);
      }
    } catch (err) {
      console.error('Failed to load trap images:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [selectedField?.field_id]);

  const toggleShowRaw = (id: number) => {
    setShowRawMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const uniqueNodes = Array.from(new Set(images.map((img) => img.node)));

  const filteredImages = images.filter((img) => {
    if (filterNode !== 'all' && img.node !== filterNode) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Unified Page Header */}
      <PageHeader
        category="ESP32-CAM Hardware Optical Stream"
        icon={Camera}
        title={language === 'kn' ? 'ಟ್ರ್ಯಾಪ್ ಕ್ಯಾಮೆರಾ ಗ್ಯಾಲರಿ' : 'Trap Camera Image Gallery'}
        description={
          language === 'kn'
            ? 'ಹಾರ್ಡ್‌ವೇರ್ ಸಾಧನಗಳಿಂದ ಸೆರೆಹಿಡಿಯಲಾದ ಪ್ರತಿಯೊಂದು ಕ್ಯಾಮೆರಾ ಚಿತ್ರ, ತಾಪಮಾನ, ಬ್ಯಾಟರಿ ಮತ್ತು AI ಕೀಟ ಎಣಿಕೆಯ ಸಂಪೂರ್ಣ ಗ್ಯಾಲರಿ.'
            : 'Complete repository of optical captures transmitted by field solar traps with toggleable raw JPEG and AI contour detection overlays.'
        }
        action={
          <Button
            variant="accent"
            size="md"
            onClick={loadGallery}
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            <span>Refresh Live Images</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card hover={false}>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-stone-500" />
            <span className="font-bold text-stone-800">Filter by Trap Node:</span>
            <select
              value={filterNode}
              onChange={(e) => setFilterNode(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 min-h-[38px] cursor-pointer"
            >
              <option value="all">All Connected Nodes ({images.length})</option>
              {uniqueNodes.map((node) => (
                <option key={node} value={node}>
                  {node}
                </option>
              ))}
            </select>
          </div>

          <div className="text-stone-600 text-xs flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>
              Displaying <strong className="text-stone-900">{filteredImages.length}</strong> verified hardware captures
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      {loading && images.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden space-y-3 p-3">
              <Skeleton className="aspect-4/3 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-stone-500 text-sm">
            No hardware images found for this filter. Connected ESP32-CAM nodes transmit on schedule.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredImages.map((img) => {
            const isRaw = showRawMap[img.id] || false;
            const displayUrl = isRaw || !img.annotated_image_url ? img.raw_image_url : img.annotated_image_url;

            return (
              <div
                key={img.id}
                className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col"
              >
                {/* Image Container with Badge */}
                <div className="relative aspect-4/3 bg-stone-900 overflow-hidden group">
                  <img
                    src={displayUrl}
                    alt={`Capture from ${img.node}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Node Pill */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-950/80 text-white shadow-xs">
                      {img.node}
                    </span>
                    <RiskPill level={img.risk} size="sm" />
                  </div>

                  {/* Top Right Zoom Button */}
                  <button
                    onClick={() => setActiveModalImg(img)}
                    className="absolute top-2 right-2 p-2 rounded-xl bg-stone-950/75 hover:bg-stone-950 text-white transition opacity-0 group-hover:opacity-100 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer shadow-sm"
                    title="Inspect High-Res Photo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Bottom Counter Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-stone-950/80 backdrop-blur-xs p-2.5 text-white flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-400 font-mono">
                      {img.total_insects} insects on card
                    </span>
                    <span className="text-[11px] text-stone-300">
                      +{img.new_catches} new
                    </span>
                  </div>
                </div>

                {/* Telemetry Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-xs">
                  <div>
                    <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{img.date_str}</span>
                    </div>

                    {/* Sensor Telemetry pills */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-[11px]">
                      <div className="p-1.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center gap-1 text-stone-700">
                        <Thermometer className="w-3 h-3 text-amber-500" />
                        <span>{img.temp ?? 27}°C</span>
                      </div>
                      <div className="p-1.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center gap-1 text-stone-700">
                        <Droplets className="w-3 h-3 text-blue-500" />
                        <span>{img.hum ?? 65}%</span>
                      </div>
                      <div className="p-1.5 bg-stone-50 rounded-lg border border-stone-100 flex items-center gap-1 text-stone-700">
                        <BatteryCharging className="w-3 h-3 text-emerald-500" />
                        <span>{img.battery_pct ?? 96}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Raw vs AI and Actions */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleShowRaw(img.id)}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition min-h-[32px] cursor-pointer ${
                        isRaw
                          ? 'bg-stone-800 text-white border-stone-800'
                          : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {isRaw ? 'Showing Raw Photo' : 'Showing AI Bounding'}
                    </button>

                    <a
                      href={img.raw_image_url}
                      download={`pestpulse_capture_${img.node}_${img.id}.jpg`}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                      title="Download Original JPEG"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeModalImg && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 rounded-3xl max-w-3xl w-full overflow-hidden border border-stone-700 shadow-2xl flex flex-col">
            <div className="h-14 px-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-white text-xs">
              <span className="font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Node: {activeModalImg.node} • High-Resolution Optical Inspection</span>
              </span>
              <button
                onClick={() => setActiveModalImg(null)}
                className="text-stone-400 hover:text-white font-bold p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="bg-black p-4 flex items-center justify-center max-h-[70vh]">
              <img
                src={activeModalImg.annotated_image_url || activeModalImg.raw_image_url}
                alt="High-Res Inspection"
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>

            <div className="p-5 bg-stone-900 text-white text-xs flex flex-wrap items-center justify-between gap-3 border-t border-stone-800">
              <div className="space-y-1">
                <div className="font-bold text-sm text-emerald-400">
                  {activeModalImg.total_insects} Total Insects Detected ({activeModalImg.engine})
                </div>
                <div className="text-[11px] text-stone-400">
                  Recorded: {activeModalImg.date_str} • Temperature: {activeModalImg.temp}°C • Humidity: {activeModalImg.hum}%
                </div>
              </div>

              <a
                href={activeModalImg.raw_image_url}
                download
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs shadow-sm min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Download Uncompressed Image</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
