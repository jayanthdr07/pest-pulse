import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Plus,
  Sprout,
  MapPin,
  Calendar,
  Ruler,
  Cpu,
  Edit2,
  Trash2,
  Check,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { Field } from '../types';

export const FieldsView: React.FC = () => {
  const { fields, selectedField, setSelectedField, refreshHome, t, language } = useApp();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('Tomato');
  const [cropVariety, setCropVariety] = useState('Arka Rakshak');
  const [areaAcres, setAreaAcres] = useState('2.5');
  const [locationName, setLocationName] = useState('Hesaraghatta, Bengaluru Rural');
  const [sowingDate, setSowingDate] = useState('2026-09-15');
  const [growthStage, setGrowthStage] = useState('Flowering & Early Fruiting');

  const handleOpenAdd = () => {
    setName('');
    setCropType('Tomato');
    setCropVariety('Arka Rakshak');
    setAreaAcres('2.0');
    setLocationName('Hesaraghatta, Bengaluru');
    setSowingDate(new Date().toISOString().split('T')[0]);
    setGrowthStage('Vegetative Growth');
    setEditingField(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (f: Field) => {
    setName(f.name);
    setCropType(f.crop_type);
    setCropVariety(f.crop_variety || '');
    setAreaAcres(String(f.area_acres));
    setLocationName(f.location_name);
    setSowingDate(f.sowing_date || '');
    setGrowthStage(f.growth_stage || 'Vegetative Growth');
    setEditingField(f);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingField) {
      await api.updateField(editingField.field_id, {
        name,
        crop_type: cropType,
        crop_variety: cropVariety,
        area_acres: parseFloat(areaAcres) || 1.0,
        location_name: locationName,
        sowing_date: sowingDate,
        growth_stage: growthStage,
      });
    } else {
      await api.createField({
        name,
        crop_type: cropType,
        crop_variety: cropVariety,
        area_acres: parseFloat(areaAcres) || 1.0,
        location_name: locationName,
        sowing_date: sowingDate,
        growth_stage: growthStage,
      });
    }

    setShowAddModal(false);
    await refreshHome();
  };

  const handleDelete = async (fid: string) => {
    if (confirm('Are you sure you want to remove this field?')) {
      await api.deleteField(fid);
      await refreshHome();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>{t('nav_fields')}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {language === 'kn' ? 'ನಿಮ್ಮ ಜಮೀನುಗಳು, ಬೆಳೆ ವಿವರಗಳು ಮತ್ತು ಜೋಡಿಸಲಾದ ಸಾಧನಗಳು' : 'Manage your agricultural plots, crop types, and connected monitoring traps'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('action_add_field')}</span>
        </button>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field) => {
          const isSelected = selectedField?.field_id === field.field_id;
          return (
            <div
              key={field.field_id}
              className={`bg-white rounded-2xl p-6 border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-stone-200 hover:border-emerald-300 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(field)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      title={t('action_edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {fields.length > 1 && (
                      <button
                        onClick={() => handleDelete(field.field_id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={t('action_delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-stone-900 mb-1">{field.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{field.location_name}</span>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-xl space-y-2 text-xs border border-stone-100 mb-4">
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t('crop')}:</span>
                    <span className="font-bold text-stone-900">{field.crop_type}</span>
                  </div>
                  {field.crop_variety && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Variety:</span>
                      <span className="font-medium text-stone-700">{field.crop_variety}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t('growth_stage')}:</span>
                    <span className="font-semibold text-emerald-800">{field.growth_stage || 'Vegetative'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">{t('acres')}:</span>
                    <span className="font-bold text-stone-900">{field.area_acres} {t('acres')}</span>
                  </div>
                  {field.sowing_date && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Sowing Date:</span>
                      <span className="font-mono text-stone-600">{field.sowing_date}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                {isSelected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Active Field</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedField(field)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Select for Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-lg font-black text-stone-900">
                {editingField ? 'Edit Field Information' : t('action_add_field')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Field Name / Identifier</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North Polyhouse Plot A"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Crop Type</label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Tomato">Tomato (ಟೊಮೆಟೊ)</option>
                    <option value="Chilli">Chilli (ಮೆಣಸಿನಕಾಯಿ)</option>
                    <option value="Brinjal">Brinjal (ಬದನೆಕಾಯಿ)</option>
                    <option value="Capsicum">Capsicum (ದಪ್ಪ ಮೆಣಸಿನಕಾಯಿ)</option>
                    <option value="Cucumber">Cucumber (ಸೌತೆಕಾಯಿ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Crop Variety</label>
                  <input
                    type="text"
                    value={cropVariety}
                    onChange={(e) => setCropVariety(e.target.value)}
                    placeholder="e.g. Arka Rakshak F1"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Farm Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1000"
                    required
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Growth Stage</label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Nursery / Seedling">Nursery / Seedling</option>
                    <option value="Vegetative Growth">Vegetative Growth</option>
                    <option value="Flowering & Early Fruiting">Flowering & Early Fruiting</option>
                    <option value="Fruit Development & Ripening">Fruit Development & Ripening</option>
                    <option value="Harvesting & Senescence">Harvesting & Senescence</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Location / Village</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Sowing / Planting Date</label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-stone-700"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow"
                >
                  {t('action_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
