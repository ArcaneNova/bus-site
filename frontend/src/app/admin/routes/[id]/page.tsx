'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowLeft, MapPin, Route, Clock, TrendingUp, BarChart2,
  RefreshCw, AlertCircle, Zap, Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), { ssr: false });

interface Stage {
  _id: string; seq: number; stage_name: string;
  location: { coordinates: [number, number] };
  stage_id: number;
}
interface Route {
  _id: string; route_name: string; start_stage: string;
  end_stage: string; distance_km: number; total_stages: number;
  isActive: boolean; url_route_id: number;
}
interface DemandSlot { hour: string; predicted: number; crowd: string; }

const CROWD_COLORS: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', very_high: '#ef4444',
};

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [route,    setRoute]    = useState<Route | null>(null);
  const [stages,   setStages]   = useState<Stage[]>([]);
  const [demand,   setDemand]   = useState<DemandSlot[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [demandLoading, setDemandLoading] = useState(false);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/routes/${id}`),
      api.get(`/routes/${id}/stages`).catch(() => api.get(`/stages?routeId=${id}&limit=300`)),
      api.get(`/schedule?routeId=${id}&limit=20`).catch(() => ({ data: { schedules: [] } })),
    ]).then(([routeRes, stagesRes, schedRes]) => {
      setRoute(routeRes.data.route);
      setStages(stagesRes.data.stages ?? stagesRes.data.data ?? []);
      setSchedules(schedRes.data.schedules ?? []);
    }).catch(() => toast.error('Failed to load route')).finally(() => setLoading(false));
  }, [id]);

  const buildDemandCurve = async () => {
    if (!route) return;
    setDemandLoading(true);
    setDemand([]);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dow   = new Date().getDay();
      const results = await Promise.all(
        Array.from({ length: 24 }, (_, h) =>
          api.post('/demand/predict', {
            route_id: id, date: today, hour: h,
            is_weekend: dow === 0 || dow === 6, weather: 'clear',
          }).then(({ data }) => ({
            hour: `${String(h).padStart(2,'0')}:00`,
            predicted: data.prediction?.predicted_count ?? 0,
            crowd: data.prediction?.crowd_level ?? 'low',
          })).catch(() => ({ hour: `${String(h).padStart(2,'0')}:00`, predicted: 0, crowd: 'low' }))
        )
      );
      setDemand(results);
    } catch { toast.error('Demand prediction failed'); }
    finally { setDemandLoading(false); }
  };

  const filtered = stages.filter(s => !search || s.stage_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading route…
    </div>
  );

  if (!route) return (
    <div className="text-center py-20">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-gray-600 font-medium">Route not found</p>
      <Link href="/admin/routes" className="text-blue-600 text-sm hover:underline mt-2 block">← Back to routes</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/admin/routes" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-500" />
            Route {route.route_name}
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${route.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {route.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {route.start_stage} → {route.end_stage}
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Distance',    value: `${route.distance_km ?? '—'} km`,    icon: MapPin,     color: 'blue' },
          { label: 'Total Stops', value: `${stages.length || route.total_stages}`, icon: Route, color: 'purple' },
          { label: "Today's Trips", value: schedules.length,                  icon: Calendar,   color: 'green' },
          { label: 'Route ID',    value: route.url_route_id ?? route._id.slice(-6), icon: TrendingUp, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border">
            <Icon className={`w-5 h-5 text-${color}-500 mb-2`} />
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" /> Route Map
          </h2>
          <span className="text-xs text-gray-400">{stages.length} stops plotted</span>
        </div>
        <div className="h-64">
          {stages.length > 0
            ? <RouteMap stages={stages} />
            : <div className="h-full flex items-center justify-center text-gray-400">
                <MapPin className="w-5 h-5 mr-2" /> No stage coordinates available
              </div>
          }
        </div>
      </div>

      {/* Demand forecast panel */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-500" /> 24-Hour Demand Forecast
          </h2>
          <button
            onClick={buildDemandCurve}
            disabled={demandLoading}
            className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {demandLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {demandLoading ? 'Predicting…' : 'Run AI Forecast'}
          </button>
        </div>
        {demand.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">Click "Run AI Forecast" to see demand prediction for this route</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={demand}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number, _: string, entry: any) => [
                `${v} pax (${entry.payload.crowd})`, 'Predicted'
              ]} />
              {demand.map((entry, idx) => (
                <Cell key={idx} fill={CROWD_COLORS[entry.crowd] ?? '#6366f1'} />
              ))}
              <Bar dataKey="predicted" name="Predicted Passengers" radius={[2, 2, 0, 0]}>
                {demand.map((entry, idx) => (
                  <Cell key={idx} fill={CROWD_COLORS[entry.crowd] ?? '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Today's Schedules */}
      {schedules.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Today&apos;s Schedule ({schedules.length} trips)</h2>
          </div>
          <div className="divide-y max-h-48 overflow-y-auto">
            {schedules.map(s => (
              <div key={s._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-800">
                    {s.departureTime ? new Date(s.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600">
                    {s.estimatedArrivalTime ? new Date(s.estimatedArrivalTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{s.bus?.busNumber ?? '—'}</span>
                  <span className={`px-1.5 py-0.5 rounded-full capitalize font-medium ${
                    s.status === 'completed'    ? 'bg-green-100 text-green-700' :
                    s.status === 'in-progress'  ? 'bg-blue-100 text-blue-700' :
                    s.status === 'cancelled'    ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'}`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stops list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-500" /> Stop Sequence ({filtered.length} stops)
          </h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stop…"
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-44 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b">
              <tr>
                {['Seq', 'Stop Name', 'Latitude', 'Longitude'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No stops found</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 text-xs">{s.seq}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{s.stage_name}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {s.location?.coordinates?.[1]?.toFixed(5) ?? '—'}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {s.location?.coordinates?.[0]?.toFixed(5) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
