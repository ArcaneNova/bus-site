'use client';

import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Trophy, Zap, Shield, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from 'recharts';

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

const DEMAND_COLORS: Record<string,string> = {
  lstm:'#8b5cf6', gru:'#06b6d4', transformer:'#f59e0b',
  xgboost:'#10b981', lightgbm:'#3b82f6', random_forest:'#f97316',
};
const DELAY_COLORS: Record<string,string> = {
  xgboost:'#10b981', lightgbm:'#3b82f6', catboost:'#8b5cf6',
  svr:'#f97316', mlp:'#06b6d4', ensemble:'#f43f5e',
};
const ANOMALY_COLORS: Record<string,string> = {
  isolation_forest:'#10b981', lof:'#f97316', ocsvm:'#8b5cf6',
  autoencoder:'#f43f5e', dbscan:'#06b6d4', ensemble:'#eab308',
};

const LABEL: Record<string,string> = {
  lstm:'LSTM', gru:'GRU', transformer:'Transformer', xgboost:'XGBoost',
  lightgbm:'LightGBM', random_forest:'Random Forest', catboost:'CatBoost',
  svr:'SVR', mlp:'MLP (Neural)', ensemble:'Ensemble',
  isolation_forest:'Isolation Forest', lof:'LOF', ocsvm:'One-Class SVM',
  autoencoder:'Autoencoder', dbscan:'DBSCAN',
};

export default function ModelComparisonPage() {
  const [report,  setReport]  = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${AI_URL}/models/comparison`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReport(await res.json());
    } catch (e: any) {
      setError('AI service offline — start it with: uvicorn main:app --port 8000');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" /> AI Model Comparison
          </h1>
          <p className="text-sm text-gray-500 mt-1">Full comparison of all trained models across demand, delay & anomaly tasks</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
      )}

      {report && !loading && (
        <>
          {/* DEMAND */}
          <TaskSection
            title="Demand Prediction"
            icon={<Zap className="w-5 h-5 text-purple-500" />}
            task={report.demand}
            colorMap={DEMAND_COLORS}
            metrics={['mae','rmse','mape','r2']}
            metricLabels={['MAE ↓','RMSE ↓','MAPE ↓','R² ↑']}
            bestKey="mae"
            bestLow
          />
          {/* DELAY */}
          <TaskSection
            title="Delay Prediction"
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            task={report.delay}
            colorMap={DELAY_COLORS}
            metrics={['mae','rmse','r2']}
            metricLabels={['MAE ↓','RMSE ↓','R² ↑']}
            bestKey="mae"
            bestLow
          />
          {/* ANOMALY */}
          <TaskSection
            title="Anomaly Detection"
            icon={<Shield className="w-5 h-5 text-red-500" />}
            task={report.anomaly}
            colorMap={ANOMALY_COLORS}
            metrics={['precision','recall','f1']}
            metricLabels={['Precision ↑','Recall ↑','F1 ↑']}
            bestKey="f1"
            bestLow={false}
          />
        </>
      )}
    </div>
  );
}

function TaskSection({ title, icon, task, colorMap, metrics, metricLabels, bestKey, bestLow }: {
  title: string; icon: React.ReactNode; task: any;
  colorMap: Record<string,string>; metrics: string[]; metricLabels: string[];
  bestKey: string; bestLow: boolean;
}) {
  const models = task?.comparison?.models ?? {};
  const best   = task?.best_model ?? '';
  const loaded = task?.loaded ?? [];

  const rows = Object.entries(models)
    .filter(([,v]: any) => !v.error)
    .map(([k, v]: any) => ({
      key: k, name: LABEL[k] ?? k,
      ...v, isBest: k === best, isLoaded: loaded.includes(k),
    }))
    .sort((a: any, b: any) => bestLow ? a[bestKey] - b[bestKey] : b[bestKey] - a[bestKey]);

  const barData = rows.map((r: any) => {
    const obj: any = { name: r.name };
    metrics.forEach(m => { obj[m] = +(r[m] ?? 0).toFixed(4); });
    return obj;
  });

  // Radar data — normalised 0-1 for each metric
  const radarData = metrics.map((m, i) => {
    const obj: any = { metric: metricLabels[i] };
    const vals = rows.map((r: any) => r[m] ?? 0);
    const max  = Math.max(...vals) || 1;
    rows.forEach((r: any) => { obj[r.name] = +((r[m] ?? 0) / max * 100).toFixed(1); });
    return obj;
  });

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-3">
        {icon}
        <div>
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-400">
            {rows.length} models trained · Best: <span className="font-semibold text-gray-600">{LABEL[best] ?? best}</span>
            {' · '}{loaded.length} loaded
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Score cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {rows.map((r: any) => (
            <div key={r.key}
              className={`rounded-xl p-3 border-2 ${r.isBest ? 'border-yellow-400 bg-yellow-50' : 'border-gray-100 bg-gray-50'} ${!r.isLoaded ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold truncate" style={{ color: colorMap[r.key] ?? '#888' }}>{r.name}</span>
                {r.isBest && <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
              </div>
              <p className="text-lg font-bold text-gray-800">{(r[bestKey] ?? 0).toFixed(4)}</p>
              <p className="text-[10px] text-gray-500">{metricLabels[metrics.indexOf(bestKey)]}</p>
              {!r.isLoaded && <p className="text-[10px] text-orange-500 mt-1">not loaded</p>}
            </div>
          ))}
        </div>

        {/* Primary metric bar chart */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{metricLabels[0]} per Model</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} layout="vertical" margin={{ left: 90, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey={metrics[0]} radius={[0, 4, 4, 0]}>
                {rows.map((r: any, i: number) => (
                  <Cell key={i} fill={colorMap[r.key] ?? '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Full table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Model</th>
                {metricLabels.map(l => (
                  <th key={l} className="text-left px-3 py-2 font-semibold text-gray-600">{l}</th>
                ))}
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Train Time</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={r.key} className={`border-b ${r.isBest ? 'bg-yellow-50' : i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                  <td className="px-3 py-2 font-semibold">
                    <span className="flex items-center gap-1">
                      {r.isBest && '🏆'} {r.name}
                    </span>
                  </td>
                  {metrics.map(m => (
                    <td key={m} className={`px-3 py-2 ${r.isBest ? 'font-bold text-purple-700' : ''}`}>
                      {(r[m] ?? 0).toFixed(4)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-gray-500">{r.train_time_sec ? `${r.train_time_sec.toFixed(0)}s` : '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      r.isLoaded ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {r.isLoaded ? '● Loaded' : '○ Not loaded'}
                    </span>
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
