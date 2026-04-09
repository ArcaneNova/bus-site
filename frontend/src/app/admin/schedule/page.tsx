'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Schedule } from '@/types';
import { Calendar, Plus, RefreshCw, Sparkles, X, ChevronDown, ChevronUp, Clock, Zap, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusColor: Record<string, string> = {
  scheduled:    'blue',
  'in-progress':'yellow',
  completed:    'green',
  cancelled:    'red',
};

interface AISlot {
  departureTime?: string;
  estimatedArrivalTime?: string;
  departure_time_str?: string;
  departure_min?: number;
  duration_min?: number;
  demand_score: number;
  crowd_level: string;
}

interface RouteOpt { _id: string; route_name: string; }
interface BusOpt   { _id: string; busNumber: string; }
interface DriverOpt { _id: string; userId: { name: string }; }

const EMPTY_FORM = {
  routeId: '', busId: '', driverId: '',
  date: new Date().toISOString().split('T')[0],
  departureTime: '06:00', estimatedArrivalTime: '07:30',
  type: 'regular', status: 'scheduled',
};

const normalizeAIBusSlot = (date: string, slot: AISlot) => {
  const baseDate = new Date(date);
  const departureIso = slot.departureTime
    || (slot.departure_time_str
      ? (() => {
          const [hours, minutes] = slot.departure_time_str.split(':').map(Number);
          const d = new Date(baseDate);
          d.setHours(hours || 0, minutes || 0, 0, 0);
          return d.toISOString();
        })()
      : slot.departure_min != null
        ? (() => {
            const d = new Date(baseDate);
            d.setHours(0, 0, 0, 0);
            d.setMinutes(slot.departure_min || 0);
            return d.toISOString();
          })()
        : baseDate.toISOString());

  const arrivalIso = slot.estimatedArrivalTime
    || (() => {
      const d = new Date(departureIso);
      d.setMinutes(d.getMinutes() + (slot.duration_min ?? 90));
      return d.toISOString();
    })();

  return {
    ...slot,
    departureTime: departureIso,
    estimatedArrivalTime: arrivalIso,
  };
};

export default function SchedulePage() {
  const [schedules,      setSchedules]      = useState<Schedule[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [date,           setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [showAIPanel,    setShowAIPanel]    = useState(false);
  const [aiRouteId,      setAIRouteId]      = useState('');
  const [aiBuses,        setAIBuses]        = useState(3);
  const [aiLoading,      setAILoading]      = useState(false);
  const [aiSlots,        setAISlots]        = useState<AISlot[]>([]);
  const [applyLoading,   setApplyLoading]   = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkResult,     setBulkResult]     = useState<{done: number; total: number} | null>(null);
  const [routes,         setRoutes]         = useState<RouteOpt[]>([]);
  const [buses,          setBuses]          = useState<BusOpt[]>([]);
  const [drivers,        setDrivers]        = useState<DriverOpt[]>([]);
  const [showModal,      setShowModal]      = useState(false);
  const [editSched,      setEditSched]      = useState<Schedule | null>(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);


  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/schedule?date=${date}&limit=50`);
      setSchedules(data.schedules);
    } catch { toast.error('Failed to load schedules'); }
    finally { setLoading(false); }
  };

  const fetchRoutes = async () => {
    try {
      const { data } = await api.get('/routes?limit=50');
      setRoutes(data.routes || []);
    } catch {}
  };

  const fetchFormOptions = async () => {
    try {
      const [rRes, bRes, dRes] = await Promise.all([
        api.get('/routes?limit=100'),
        api.get('/buses?limit=50'),
        api.get('/drivers?limit=50'),
      ]);
      setRoutes(rRes.data.routes || []);
      setBuses(bRes.data.buses || []);
      setDrivers(dRes.data.drivers || []);
    } catch {}
  };

  const openCreate = () => {
    setEditSched(null);
    setForm({ ...EMPTY_FORM, date });
    fetchFormOptions();
    setShowModal(true);
  };

  const openEdit = (s: Schedule) => {
    setEditSched(s);
    setForm({
      routeId:              (s.route as any)?._id || '',
      busId:                (s.bus as any)?._id   || '',
      driverId:             (s.driver as any)?._id || '',
      date:                 s.date?.split('T')[0] || date,
      departureTime:        s.departureTime ? new Date(s.departureTime).toTimeString().slice(0, 5) : '06:00',
      estimatedArrivalTime: s.estimatedArrivalTime ? new Date(s.estimatedArrivalTime).toTimeString().slice(0, 5) : '07:30',
      type:                 s.type   || 'regular',
      status:               s.status || 'scheduled',
    });
    fetchFormOptions();
    setShowModal(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const makeDate = (dateStr: string, timeStr: string) => {
        const d = new Date(dateStr);
        const [h, m] = timeStr.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        return d.toISOString();
      };
      const payload = {
        route:                form.routeId,
        bus:                  form.busId,
        driver:               form.driverId,
        date:                 new Date(form.date).toISOString(),
        departureTime:        makeDate(form.date, form.departureTime),
        estimatedArrivalTime: makeDate(form.date, form.estimatedArrivalTime),
        type:                 form.type,
        status:               form.status,
      };
      if (editSched) {
        await api.put(`/schedule/${editSched._id}`, payload);
        toast.success('Schedule updated');
      } else {
        await api.post('/schedule', payload);
        toast.success('Schedule created');
      }
      setShowModal(false);
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/schedule/${id}`);
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch { toast.error('Failed to delete'); }
  };

  useEffect(() => { fetchSchedules(); }, [date]);
  useEffect(() => { if (showAIPanel) fetchRoutes(); }, [showAIPanel]);

  const generateAISchedule = async () => {
    if (!aiRouteId) { toast.error('Select a route first'); return; }
    setAILoading(true);
    setAISlots([]);
    try {
      const { data } = await api.post('/schedule/generate-ai', {
        date,
        routeIds: [aiRouteId],
        totalBusesAvailable: aiBuses,
      });
      const normalized = (data.slots || []).map((slot: AISlot) => normalizeAIBusSlot(date, slot));
      setAISlots(normalized);
      toast.success(`Generated ${normalized.length} optimal slots`);
    } catch {
      toast.error('AI generation failed — check AI service is running');
    } finally {
      setAILoading(false);
    }
  };

  const bulkGenerateAll = async () => {
    if (routes.length === 0) await fetchRoutes();
    const allRoutes = routes.length ? routes : (await api.get('/routes?limit=100')).data.routes ?? [];
    if (!allRoutes.length) { toast.error('No routes found'); return; }
    setBulkGenerating(true);
    setBulkResult(null);
    let done = 0;
    for (const route of allRoutes.slice(0, 20)) { // max 20 to avoid timeout
      try {
        const { data } = await api.post('/schedule/generate-ai', {
          date, routeIds: [route._id], totalBusesAvailable: aiBuses,
        });
        const normalizedSlots = (data.slots || []).map((slot: AISlot) => normalizeAIBusSlot(date, slot));
        if (normalizedSlots.length) {
          await api.post('/schedule/generate-ai/apply', {
            date, routeId: route._id, slots: normalizedSlots,
          });
          done++;
        }
      } catch {}
    }
    setBulkResult({ done, total: Math.min(allRoutes.length, 20) });
    setBulkGenerating(false);
    fetchSchedules();
    toast.success(`Bulk AI schedule: ${done}/${Math.min(allRoutes.length, 20)} routes scheduled`);
  };



  const applyAISchedule = async () => {
    if (!aiSlots.length || !aiRouteId) return;
    setApplyLoading(true);
    try {
      await api.post('/schedule/generate-ai/apply', {
        date,
        routeId: aiRouteId,
        slots: aiSlots.map((slot) => normalizeAIBusSlot(date, slot)),
      });
      toast.success('AI schedule applied to database!');
      setAISlots([]);
      setShowAIPanel(false);
      fetchSchedules();
    } catch {
      toast.error('Failed to apply schedule');
    } finally {
      setApplyLoading(false);
    }
  };

  const crowdColor: Record<string, string> = {
    low: 'green', medium: 'yellow', high: 'orange', very_high: 'red',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Schedule</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={fetchSchedules} className="p-2 text-gray-500 hover:text-blue-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          {/* AI Generate button */}
          <button
            onClick={() => setShowAIPanel((v) => !v)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Generate AI Schedule
            {showAIPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Add Trip
          </button>
        </div>
      </div>

      {/* AI Schedule Panel */}
      {showAIPanel && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-purple-900">AI Schedule Generator</h2>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">LSTM + Optimizer</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={bulkGenerateAll}
                disabled={bulkGenerating}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                {bulkGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {bulkGenerating ? 'Generating all…' : '⚡ All Routes'}
              </button>
              <button onClick={() => { setShowAIPanel(false); setAISlots([]); setBulkResult(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {bulkResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium">
                Bulk AI schedule complete: <strong>{bulkResult.done}/{bulkResult.total}</strong> routes scheduled for {date}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <select
                value={aiRouteId}
                onChange={(e) => setAIRouteId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select route…</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>{r.route_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Buses</label>
              <input
                type="number" min={1} max={20}
                value={aiBuses}
                onChange={(e) => setAIBuses(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateAISchedule}
                disabled={aiLoading || !aiRouteId}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {aiLoading ? 'Generating…' : 'Generate Slots'}
              </button>
            </div>
          </div>

          {/* Generated slots */}
          {aiSlots.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{aiSlots.length} AI-optimized slots for {date}</p>
                <button
                  onClick={applyAISchedule}
                  disabled={applyLoading}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {applyLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  ✅ Apply to Database
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {aiSlots.map((slot, idx) => {
                  const cc = crowdColor[slot.crowd_level] || 'gray';
                  return (
                    <div key={idx} className="bg-white rounded-lg border px-3 py-2 text-xs">
                      <p className="font-semibold text-gray-700">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(slot.departureTime || slot.departure_time_str || date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-gray-400 mt-0.5">→ {new Date(slot.estimatedArrivalTime || slot.departureTime || slot.departure_time_str || date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded bg-${cc}-100 text-${cc}-700 capitalize`}>
                        {slot.crowd_level?.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <p className="text-center py-10 text-gray-400">Loading…</p>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3" />
            <p>No schedules for {date}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Route', 'Bus', 'Driver', 'Departure', 'ETA', 'Type', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {schedules.map((s) => {
                const color = statusColor[s.status] || 'gray';
                return (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-48 truncate">{s.route?.route_name}</td>
                    <td className="px-4 py-3">{s.bus?.busNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{(s.driver?.userId as any)?.name || '—'}</td>
                    <td className="px-4 py-3">{formatDate(s.departureTime, { timeStyle: 'short' })}</td>
                    <td className="px-4 py-3">{formatDate(s.estimatedArrivalTime, { timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 capitalize">{s.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 capitalize`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteSchedule(s._id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">{editSched ? 'Edit Schedule' : 'Create Schedule'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Route *</label>
                <select value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select route…</option>
                  {routes.map((r) => <option key={r._id} value={r._id}>{r.route_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus *</label>
                  <select value={form.busId} onChange={(e) => setForm({ ...form, busId: e.target.value })} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select bus…</option>
                    {buses.map((b) => <option key={b._id} value={b._id}>{b.busNumber}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver *</label>
                  <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select driver…</option>
                    {drivers.map((d) => <option key={d._id} value={d._id}>{(d.userId as any)?.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                  <input type="time" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Arrival *</label>
                  <input type="time" value={form.estimatedArrivalTime} onChange={(e) => setForm({ ...form, estimatedArrivalTime: e.target.value })} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="regular">Regular</option>
                    <option value="peak">Peak</option>
                    <option value="express">Express</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : editSched ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
