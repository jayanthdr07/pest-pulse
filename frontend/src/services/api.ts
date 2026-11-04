import {
  Farmer,
  Field,
  Device,
  Observation,
  InsectDetection,
  PestDetails,
  Disease,
  FertilizerPlan,
  AlertItem,
  SprayRecord,
  HomeData,
  WeatherData
} from '../types';

const API_BASE = '/api/v1';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('pestpulse_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(contact: string, password: string): Promise<{ ok: boolean; token?: string; farmer?: Farmer; fields?: Field[]; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact, password }),
    });
    return res.json();
  },

  async register(data: any): Promise<{ ok: boolean; token?: string; farmer?: Farmer; primary_field?: Field; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async me(): Promise<{ ok: boolean; farmer?: Farmer; fields?: Field[] }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async updateMe(data: Partial<Farmer>): Promise<{ ok: boolean; farmer?: Farmer }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Home / Overview
  async getHome(fieldId?: string): Promise<HomeData> {
    const q = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : '';
    const res = await fetch(`${API_BASE}/home${q}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  // Fields
  async getFields(): Promise<Field[]> {
    const res = await fetch(`${API_BASE}/fields`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async createField(data: Partial<Field>): Promise<{ ok: boolean; field: Field }> {
    const res = await fetch(`${API_BASE}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateField(fid: string, data: Partial<Field>): Promise<{ ok: boolean; field: Field }> {
    const res = await fetch(`${API_BASE}/fields/${fid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteField(fid: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/fields/${fid}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    return res.json();
  },

  // Devices
  async getDevices(fieldId?: string): Promise<Device[]> {
    const q = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : '';
    const res = await fetch(`${API_BASE}/devices${q}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async getTrapDetail(node: string): Promise<any> {
    const res = await fetch(`${API_BASE}/traps/${node}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async updateTrap(node: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/traps/${node}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Observations & Detections
  async getObservations(limit = 24, fieldId?: string, node?: string): Promise<Observation[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (fieldId) params.set('field_id', fieldId);
    if (node) params.set('node', node);
    const res = await fetch(`${API_BASE}/observations?${params.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async getDetections(limit = 30, fieldId?: string, insectClass?: string): Promise<InsectDetection[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (fieldId) params.set('field_id', fieldId);
    if (insectClass) params.set('insect_class', insectClass);
    const res = await fetch(`${API_BASE}/detections?${params.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  // Pests catalog
  async getPests(): Promise<Record<string, PestDetails>> {
    const res = await fetch(`${API_BASE}/pests`);
    return res.json();
  },

  async getPestDetail(pid: string): Promise<PestDetails> {
    const res = await fetch(`${API_BASE}/pests/${pid}`);
    return res.json();
  },

  // Crop Diseases
  async getDiseases(crop?: string, pest?: string): Promise<Disease[]> {
    const params = new URLSearchParams();
    if (crop) params.set('crop', crop);
    if (pest) params.set('pest', pest);
    const res = await fetch(`${API_BASE}/diseases?${params.toString()}`);
    return res.json();
  },

  // Fertilizers
  async getFertilizers(crop = 'Tomato', acres = 1.0, fieldId?: string): Promise<FertilizerPlan> {
    const params = new URLSearchParams({ crop, acres: String(acres) });
    if (fieldId) params.set('field_id', fieldId);
    const res = await fetch(`${API_BASE}/recommendations/fertilizers?${params.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  // Spray Advice & Sprays
  async getSprayAdvice(fieldId?: string): Promise<any> {
    const q = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : '';
    const res = await fetch(`${API_BASE}/spray/advice${q}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async getSprays(days = 120, fieldId?: string): Promise<SprayRecord[]> {
    const params = new URLSearchParams({ days: String(days) });
    if (fieldId) params.set('field_id', fieldId);
    const res = await fetch(`${API_BASE}/sprays?${params.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async addSpray(record: Partial<SprayRecord>): Promise<{ ok: boolean; id: number }> {
    const res = await fetch(`${API_BASE}/sprays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(record),
    });
    return res.json();
  },

  async deleteSpray(id: number): Promise<{ ok: boolean }> {
    const res = await fetch(`${API_BASE}/sprays/${id}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    return res.json();
  },

  // Alerts
  async getAlerts(limit = 50, fieldId?: string): Promise<AlertItem[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (fieldId) params.set('field_id', fieldId);
    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async updateAlert(aid: number, data: { done?: number[]; acked?: boolean }): Promise<AlertItem> {
    const res = await fetch(`${API_BASE}/alerts/${aid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // History & CSV
  async getHistory(days = 30, node?: string, fieldId?: string): Promise<any> {
    const params = new URLSearchParams({ days: String(days) });
    if (node) params.set('node', node);
    if (fieldId) params.set('field_id', fieldId);
    const res = await fetch(`${API_BASE}/history?${params.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  getReportCsvUrl(days = 7, fieldId?: string): string {
    const params = new URLSearchParams({ days: String(days) });
    if (fieldId) params.set('field_id', fieldId);
    return `${API_BASE}/report.csv?${params.toString()}`;
  },

  // Weather
  async getWeather(lat?: number, lon?: number, fieldId?: string): Promise<WeatherData> {
    const params = new URLSearchParams();
    if (lat !== undefined) params.set('lat', String(lat));
    if (lon !== undefined) params.set('lon', String(lon));
    if (fieldId) params.set('field_id', fieldId);
    const res = await fetch(`${API_BASE}/weather?${params.toString()}`);
    return res.json();
  },

  // 3D Simulation
  async startSimulation(data: { field_id?: string; scenario?: string; pest_before?: string; pest_after?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getSimulationEvents(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/simulation/events`, {
      headers: authHeader(),
    });
    return res.json();
  },

  // Crop Passport
  async getPassport(fieldId: string): Promise<{ ok: boolean; passport: any; report: any; qr_data_url: string; passport_url: string }> {
    const res = await fetch(`${API_BASE}/passport/field/${encodeURIComponent(fieldId)}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async generatePassport(data: { field_id: string; access_type?: string; custom_notes?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/passport/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updatePassportSettings(pid: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/passport/${pid}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async revokePassport(pid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/passport/${pid}/revoke`, {
      method: 'POST',
      headers: authHeader(),
    });
    return res.json();
  },

  async regeneratePassportToken(pid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/passport/${pid}/regenerate-token`, {
      method: 'POST',
      headers: authHeader(),
    });
    return res.json();
  },

  async getPublicPassport(token: string): Promise<{ ok: boolean; report?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/passport/view/${encodeURIComponent(token)}`);
    return res.json();
  },

  // Treatments
  async getTreatments(fieldId?: string): Promise<{ ok: boolean; treatments: any[]; count: number }> {
    const q = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : '';
    const res = await fetch(`${API_BASE}/treatments${q}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async createTreatment(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/treatments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateTreatment(tid: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/treatments/${tid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteTreatment(tid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/treatments/${tid}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    return res.json();
  },

  // Escalations
  async getEscalations(fieldId?: string, status?: string): Promise<{ ok: boolean; escalations: any[]; count: number }> {
    const params = new URLSearchParams();
    if (fieldId) params.set('field_id', fieldId);
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE}/escalations?${params.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async evaluateEscalation(fieldId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/escalations/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ field_id: fieldId }),
    });
    return res.json();
  },

  async resolveEscalation(eid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/escalations/${eid}/resolve`, {
      method: 'POST',
      headers: authHeader(),
    });
    return res.json();
  },

  // Experts & Appointments
  async getExperts(): Promise<{ ok: boolean; experts: any[]; count: number }> {
    const res = await fetch(`${API_BASE}/experts`);
    return res.json();
  },

  async getAppointments(fieldId?: string): Promise<{ ok: boolean; appointments: any[]; count: number }> {
    const q = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : '';
    const res = await fetch(`${API_BASE}/appointments${q}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async createAppointment(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateAppointment(aid: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/appointments/${aid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteAppointment(aid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/appointments/${aid}`, {
      method: 'DELETE',
      headers: authHeader(),
    });
    return res.json();
  },

  async getAppointmentJitsi(aid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/appointments/${aid}/jitsi`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async simulateAcceptAppointment(aid: string): Promise<any> {
    const res = await fetch(`${API_BASE}/appointments/${aid}/simulate-accept`, {
      method: 'POST',
      headers: authHeader(),
    });
    return res.json();
  },

  // Voice Agent
  async getVoiceScript(fieldId?: string): Promise<any> {
    const q = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : '';
    const res = await fetch(`${API_BASE}/voice/latest-script${q}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async getVoiceHistory(): Promise<{ ok: boolean; communications: any[]; count: number }> {
    const res = await fetch(`${API_BASE}/voice/history`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async triggerVoiceCall(fieldId?: string, language: string = 'en'): Promise<any> {
    const res = await fetch(`${API_BASE}/voice/trigger-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ field_id: fieldId, language }),
    });
    return res.json();
  },

  async logVoicePlayback(commId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/voice/log-playback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ comm_id: commId }),
    });
    return res.json();
  },

  async getVoicePreferences(): Promise<any> {
    const res = await fetch(`${API_BASE}/voice/preferences`, {
      headers: authHeader(),
    });
    return res.json();
  },

  async updateVoicePreferences(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/voice/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Trap Images Gallery
  async getTrapImages(params?: { node?: string; field_id?: string; limit?: number }): Promise<{ ok: boolean; images: any[]; count: number }> {
    const q = new URLSearchParams();
    if (params?.node) q.set('node', params.node);
    if (params?.field_id) q.set('field_id', params.field_id);
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await fetch(`${API_BASE}/trap-images?${q.toString()}`, {
      headers: authHeader(),
    });
    return res.json();
  },

  // Photo Upload & Insect Count
  async uploadAndCount(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/upload-count`, {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    });
    return res.json();
  },
};
