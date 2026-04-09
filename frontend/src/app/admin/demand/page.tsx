'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart2, Zap, RefreshCw, CloudRain, Sun, Wind, Thermometer, Users, AlertTriangle, TrendingUp, GitCompare, Grid } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Route { _id: string; route_name: string; }
interface PredictionResult {
  route_id: string;
  predicted_count: number;
  crowd_level: string;
  confidence: number;
  peak_factor: number;
}
interface HistoryRow {
  _id: string;
  route: { route_name: string };
  predictedCount: number;
  actualCount: number;
  crowdLevel: string;
  createdAt: string;
}

const weatherOptions = ['clear', 'rain', 'fog', 'extreme'];
const crowdColors: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', very_high: '#ef4444',
};
const crowdBg: Record<string, string> = {
  low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700', very_high: 'bg-red-100 text-red-700',
};

export default function DemandPage() {
  const [routes,    setRoutes]    = useState<Route[]>([]);
  const [routeId,   setRouteId]   = useState('');
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [hour,      setHour]      = useState(new Date().getHours());
  const [weather,   setWeather]   = useState('clear');
  const [isHoliday, setIsHoliday] = useState(false);
  const [special,   setSpecial]   = useState(false);
  const [result,    setResult]    = useState<PredictionResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [history,   setHistory]   = useState<HistoryRow[]>([]);
  const [hLoading,  setHLoading]  = useState(false);
  const [dayCurve,  setDayCurve]  = useState<any[]>([]);
  const [curveLoad, setCurveLoad] = useState(false);

  useEffect(() => {
    api.get('/routes?limit=100').then(({ data }) => setRoutes(data.routes || []));
  }, []);

  useEffect(() => {
    if (!routeId) return;
    setHLoading(true);
    api.get(`/demand?routeId=${routeId}&limit=20`)
      .then(({ data }) => setHistory(data.demand || []))
      .catch(() => {})
      .finally(() => setHLoading(false));
  }, [routeId]);

  const predict = async () => {
    if (!routeId) { toast.error('Select a route'); return; }
    setLoading(true);
    setResult(null);
    try {
      const dow = new Date(date).getDay();
      const { data } = await api.post('/demand/predict', {
        route_id:    routeId,
        date,
        hour,
        is_weekend:  dow === 0 || dow === 6,
        is_holiday:  isHoliday,
        weather,
        special_event: special,
      });
      setResult(data.prediction);
      toast.success('Prediction complete!');
    } catch {
      toast.error('Prediction failed — ensure AI service is running');
    } finally {
      setLoading(false);
    }
  };

  const buildDayCurve = async () => {
    if (!routeId) return;
    setCurveLoad(true);
    setDayCurve([]);
    try {
      const dow = new Date(date).getDay();
      const results = await Promise.all(
        Array.from({ length: 24 }, (_, h) =>
          api.post('/demand/predict', {
            route_id: routeId, date, hour: h,
            is_weekend: dow === 0 || dow === 6,
            is_holiday: isHoliday, weather, special_event: special,
          }).then(({ data }) => ({ hour: `${h}:00`, predicted: data.prediction?.predicted_count || 0, crowd: data.prediction?.crowd_level }))
            .catch(() => ({ hour: `${h}:00`, predicted: 0, crowd: 'low' }))
        )
      );
      setDayCurve(results);
    } catch { toast.error('Failed to build curve'); }
    finally { setCurveLoad(false); }
  };

  const weatherIcon = { clear: Sun, rain: CloudRain, fog: Wind, extreme: Thermometer };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Demand Prediction</h1>
      <p className="text-sm text-gray-500 -mt-4">AI-powered passenger demand forecasting using LSTM neural network.</p>

      {/* Input panel */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" /> Prediction Parameters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Route */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <select value={routeId} onChange={(e) => setRouteId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select route…</option>
              {routes.map((r) => <option key={r._id} value={r._id}>{r.route_name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          {/* Hour */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hour: {hour}:00</label>
            <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))}
              className="w-full accent-purple-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>12 AM</span><span>12 PM</span><span>11 PM</span></div>
          </div>
        </div>

        {/* Weather */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weather Condition</label>
          <div className="flex gap-2 flex-wrap">
            {weatherOptions.map((w) => {
              const Icon = weatherIcon[w as keyof typeof weatherIcon];
              return (
                <button key={w} onClick={() => setWeather(w)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm capitalize transition ${weather === w ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                  <Icon className="w-4 h-4" /> {w}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isHoliday} onChange={(e) => setIsHoliday(e.target.checked)} className="accent-purple-600 w-4 h-4" />
            <span className="text-sm text-gray-700">Public Holiday</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} className="accent-purple-600 w-4 h-4" />
            <span className="text-sm text-gray-700">Special Event Nearby</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={predict} disabled={loading || !routeId}
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
            {loading ? 'Predicting…' : 'Predict'}
          </button>
          <button onClick={buildDayCurve} disabled={curveLoad || !routeId}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
            {curveLoad ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {curveLoad ? 'Building…' : 'Build 24h Curve'}
          </button>
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Prediction Result</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{result.predicted_count}</p>
              <p className="text-xs text-blue-500 mt-1">Predicted Passengers</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${crowdBg[result.crowd_level] || 'bg-gray-100 text-gray-600'}`}>
                {result.crowd_level?.replace('_', ' ').toUpperCase()}
              </span>
              <p className="text-xs text-gray-500 mt-2">Crowd Level</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{Math.round(result.confidence * 100)}%</p>
              <p className="text-xs text-green-500 mt-1">Confidence</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-orange-700">×{result.peak_factor?.toFixed(2)}</p>
              <p className="text-xs text-orange-500 mt-1">Peak Factor</p>
            </div>
          </div>
          {result.crowd_level === 'very_high' && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              High demand predicted — consider adding extra buses for this slot.
            </div>
          )}
        </div>
      )}

      {/* 24h demand curve */}
      {dayCurve.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">24-Hour Demand Curve</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dayCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="#ede9fe" name="Predicted Passengers" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Multi-route comparison */}
      <MultiRouteComparison routes={routes} date={date} weather={weather} isHoliday={isHoliday} />

      {/* Peak-Hour Heatmap Grid */}
      <PeakHourGrid routes={routes} />

      {/* History table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
          Prediction History
        </div>
        {hLoading ? (
          <p className="text-center py-8 text-gray-400">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-center py-8 text-gray-400">No history yet — run a prediction to see it here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                {['Route', 'Predicted', 'Actual', 'Crowd Level', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.route?.route_name || '—'}</td>
                  <td className="px-4 py-3">{row.predictedCount}</td>
                  <td className="px-4 py-3">{row.actualCount || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${crowdBg[row.crowdLevel] || ''}`}>
                      {row.crowdLevel?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Multi-Route Comparison Component ────────────────────────────────────────
const COMPARE_COLORS = ['#8b5cf6', '#10b981', '#f59e0b'];

function MultiRouteComparison({ routes, date, weather, isHoliday }: {
  routes: { _id: string; route_name: string }[];
  date: string; weather: string; isHoliday: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [curves,   setCurves]   = useState<Record<string, { hour: string; predicted: number }[]>>({});
  const [loading,  setLoading]  = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const runComparison = async () => {
    if (selected.length < 2) return toast.error('Select at least 2 routes');
    setLoading(true);
    const newCurves: typeof curves = {};
    const dow = new Date(date).getDay();
    await Promise.all(selected.map(async rid => {
      const results = await Promise.all(
        Array.from({ length: 24 }, (_, h) =>
          api.post('/demand/predict', {
            route_id: rid, date, hour: h,
            is_weekend: dow === 0 || dow === 6, is_holiday: isHoliday, weather,
          }).then(({ data }) => ({ hour: `${String(h).padStart(2,'0')}:00`, predicted: data.prediction?.predicted_count ?? 0 }))
            .catch(() => ({ hour: `${String(h).padStart(2,'0')}:00`, predicted: 0 }))
        )
      );
      newCurves[rid] = results;
    }));
    setCurves(newCurves);
    setLoading(false);
  };

  // Merge all curve data into one array with each route as a key
  const merged = Array.from({ length: 24 }, (_, h) => {
    const obj: any = { hour: `${String(h).padStart(2,'0')}:00` };
    selected.forEach(rid => {
      const name = routes.find(r => r._id === rid)?.route_name?.slice(0, 12) ?? rid.slice(-6);
      obj[name] = curves[rid]?.[h]?.predicted ?? 0;
    });
    return obj;
  });

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-green-500" /> Multi-Route Demand Comparison
        <span className="text-xs text-gray-400">(select 2–3 routes)</span>
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {routes.slice(0, 20).map(r => (
          <button key={r._id} onClick={() => toggle(r._id)}
            className={`px-2 py-1 rounded-lg border text-xs transition ${selected.includes(r._id) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'}`}>
            {r.route_name.slice(0, 18)}
          </button>
        ))}
      </div>
      <button onClick={runComparison} disabled={loading || selected.length < 2}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 mb-4">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
        {loading ? 'Comparing…' : 'Compare Selected'}
      </button>
      {Object.keys(curves).length >= 2 && (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {selected.map((rid, i) => {
              const key = routes.find(r => r._id === rid)?.route_name?.slice(0, 12) ?? rid.slice(-6);
              return <Area key={rid} type="monotone" dataKey={key} stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i] + '33'} />;
            })}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Peak-Hour Heatmap Grid ───────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HEAT_COLORS = [
  // level 0-4 (low→high) as rgba
  'bg-green-100', 'bg-green-300', 'bg-yellow-300', 'bg-orange-400', 'bg-red-500',
];

function PeakHourGrid({ routes }: { routes: { _id: string; route_name: string }[] }) {
  const [gridRoute, setGridRoute] = useState('');
  const [grid, setGrid]           = useState<number[][]>([]);
  const [loading, setLoading]     = useState(false);

  // Synthetic pattern grid (until real data is available)
  const buildSyntheticGrid = () => {
    const PATTERN = [0,0,0,0,0,1,2,4,4,3,2,2,2,2,3,3,4,4,3,2,1,1,0,0];
    return Array.from({ length: 7 }, (_, d) =>
      PATTERN.map(v => Math.min(4, Math.max(0, v + (d > 0 && d < 6 ? 0 : -1) + Math.floor(Math.random() * 2))))
    );
  };

  const loadGrid = async () => {
    if (!gridRoute) return;
    setLoading(true);
    // Try to get demand history from DB then fall back to synthetic
    try {
      const { data } = await api.get(`/demand?routeId=${gridRoute}&limit=200`);
      const rows: any[] = data.demand ?? [];
      if (rows.length < 10) { setGrid(buildSyntheticGrid()); setLoading(false); return; }
      const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      const cnt: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      rows.forEach((r: any) => {
        const d = new Date(r.forDate); const dow = d.getDay(); const h = r.hour ?? 0;
        if (dow >= 0 && dow < 7 && h >= 0 && h < 24) { g[dow][h] += r.predictedCount ?? 0; cnt[dow][h]++; }
      });
      const max = Math.max(...g.flatMap((row, i) => row.map((v, j) => cnt[i][j] ? v / cnt[i][j] : 0)));
      const normalised = g.map((row, i) => row.map((v, j) => {
        const avg = cnt[i][j] ? v / cnt[i][j] : 0;
        return Math.round((avg / (max || 1)) * 4);
      }));
      setGrid(normalised);
    } catch { setGrid(buildSyntheticGrid()); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Grid className="w-4 h-4 text-orange-500" /> Peak-Hour Demand Heatmap (Hour × Day-of-Week)
      </h2>
      <div className="flex gap-3 mb-4">
        <select value={gridRoute} onChange={e => setGridRoute(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1 max-w-xs">
          <option value="">Select route…</option>
          {routes.slice(0, 50).map(r => <option key={r._id} value={r._id}>{r.route_name}</option>)}
        </select>
        <button onClick={loadGrid} disabled={loading || !gridRoute}
          className="flex items-center gap-2 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Grid className="w-4 h-4" />}
          Load
        </button>
      </div>
      {grid.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-0.5 mb-1 ml-8">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="w-6 text-center text-[9px] text-gray-400 flex-shrink-0">{h}</div>
            ))}
          </div>
          {grid.map((row, d) => (
            <div key={d} className="flex items-center gap-0.5 mb-0.5">
              <span className="text-xs text-gray-500 w-8 flex-shrink-0">{DAYS[d]}</span>
              {row.map((val, h) => (
                <div key={h}
                  className={`w-6 h-5 rounded-sm flex-shrink-0 cursor-default ${HEAT_COLORS[val] ?? 'bg-gray-100'}`}
                  title={`${DAYS[d]} ${h}:00 — Level ${val}/4`}
                />
              ))}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Low</span>
            {HEAT_COLORS.map((c, i) => <div key={i} className={`w-4 h-4 rounded ${c}`} />)}
            <span>High</span>
          </div>
        </div>
      )}
      {grid.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">Select a route and click "Load" to see the demand grid</p>}
    </div>
  );
}

