'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Zap, Bus, MapPin, ArrowRight, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface Stage { _id: string; stage_name: string; seq: number; }
interface FareResult {
  amount: number;
  currency: string;
  busType: string;
  distanceKm: number;
  from: string;
  to: string;
  slabInfo: string;
  concessionsAvailable: string[];
}

const BUS_TYPES = [
  { key: 'non-AC',   label: 'Non-AC Bus',   color: 'bg-blue-100 text-blue-800',   emoji: '🚌', desc: 'Standard DTC bus' },
  { key: 'AC',       label: 'AC Bus',        color: 'bg-cyan-100 text-cyan-800',   emoji: '❄️', desc: 'Air conditioned'  },
  { key: 'electric', label: 'Electric Bus',  color: 'bg-green-100 text-green-800', emoji: '⚡', desc: 'Eco-friendly EV'  },
];

export default function FareCalculatorPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery,   setToQuery]   = useState('');
  const [busType,   setBusType]   = useState('non-AC');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<FareResult | null>(null);
  const [error,     setError]     = useState('');
  const [showConcessions, setShowConcessions] = useState(false);

  // Stage autocomplete
  const [fromSuggestions, setFromSuggestions] = useState<Stage[]>([]);
  const [toSuggestions,   setToSuggestions]   = useState<Stage[]>([]);
  const [fromSelected,    setFromSelected]    = useState('');
  const [toSelected,      setToSelected]      = useState('');

  const searchStages = async (q: string, setList: (s: Stage[]) => void) => {
    if (q.length < 2) { setList([]); return; }
    try {
      const r = await fetch(`${apiBase}/stages?search=${encodeURIComponent(q)}&limit=6`);
      const d = await r.json();
      setList(d.data ?? []);
    } catch { setList([]); }
  };

  useEffect(() => { const t = setTimeout(() => searchStages(fromQuery, setFromSuggestions), 300); return () => clearTimeout(t); }, [fromQuery]);
  useEffect(() => { const t = setTimeout(() => searchStages(toQuery,   setToSuggestions),   300); return () => clearTimeout(t); }, [toQuery]);

  const calculate = async () => {
    if (!fromQuery.trim() || !toQuery.trim()) { setError('Please enter both origin and destination stops.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const params = new URLSearchParams({
        fromStage: fromSelected || fromQuery,
        toStage:   toSelected   || toQuery,
        busType,
      });
      const r = await fetch(`${apiBase}/public/fare?${params}`);
      const d = await r.json();
      if (d.success) setResult(d.fare);
      else setError(d.message || 'Could not calculate fare');
    } catch {
      setError('Service unavailable — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* TOP BAR */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">SmartDTC</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/track" className="hover:text-blue-600 transition">Track Buses</Link>
            <Link href="/routes" className="hover:text-blue-600 transition">Routes</Link>
            <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition">Admin</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-3 h-3" /> DTC Official Fare Slabs
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Bus Fare Calculator</h1>
          <p className="text-gray-500 text-base">
            Calculate the exact DTC bus fare for any route based on distance slabs, bus type, and available concessions.
          </p>
        </div>

        {/* CALCULATOR CARD */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* FROM */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-green-500" />From Stop
              </label>
              <input
                value={fromQuery}
                onChange={e => { setFromQuery(e.target.value); setFromSelected(''); setResult(null); }}
                placeholder="e.g. ISBT Kashmere Gate"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fromSuggestions.length > 0 && !fromSelected && (
                <ul className="absolute z-10 top-full left-0 right-0 bg-white border rounded-xl shadow-lg mt-1 max-h-44 overflow-y-auto">
                  {fromSuggestions.map(s => (
                    <li key={s._id} onClick={() => { setFromQuery(s.stage_name); setFromSelected(s.stage_name); setFromSuggestions([]); }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700">
                      {s.stage_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* TO */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-red-500" />To Stop
              </label>
              <input
                value={toQuery}
                onChange={e => { setToQuery(e.target.value); setToSelected(''); setResult(null); }}
                placeholder="e.g. Dwarka Sector 21"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {toSuggestions.length > 0 && !toSelected && (
                <ul className="absolute z-10 top-full left-0 right-0 bg-white border rounded-xl shadow-lg mt-1 max-h-44 overflow-y-auto">
                  {toSuggestions.map(s => (
                    <li key={s._id} onClick={() => { setToQuery(s.stage_name); setToSelected(s.stage_name); setToSuggestions([]); }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700">
                      {s.stage_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* BUS TYPE */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Bus Type</label>
            <div className="grid grid-cols-3 gap-3">
              {BUS_TYPES.map(bt => (
                <button key={bt.key} onClick={() => setBusType(bt.key)}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all ${
                    busType === bt.key ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <span className="text-2xl">{bt.emoji}</span>
                  <span className="text-xs font-semibold text-gray-800">{bt.label}</span>
                  <span className="text-xs text-gray-400">{bt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button onClick={calculate} disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white py-4 rounded-xl font-semibold text-base transition flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {loading ? 'Calculating…' : 'Calculate Fare'}
          </button>
        </div>

        {/* RESULT */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Fare amount header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
              <p className="text-sm text-blue-200 mb-1">Estimated Fare</p>
              <p className="text-6xl font-extrabold">₹{result.amount}</p>
              <p className="text-sm text-blue-200 mt-2">{result.busType} · {result.slabInfo}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Journey details */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">From</p>
                  <p className="font-semibold text-gray-800 text-sm">{result.from || fromQuery}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 text-right">
                  <p className="text-xs text-gray-500 mb-0.5">To</p>
                  <p className="font-semibold text-gray-800 text-sm">{result.to || toQuery}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{result.distanceKm} km</p>
                  <p className="text-xs text-blue-500 mt-1">Estimated Distance</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">₹{result.amount}</p>
                  <p className="text-xs text-green-500 mt-1">{result.busType} fare</p>
                </div>
              </div>

              {/* All bus types comparison */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">Compare bus types</div>
                {BUS_TYPES.map(bt => (
                  <div key={bt.key} className="flex items-center justify-between px-4 py-3 border-t first:border-t-0">
                    <span className="text-sm text-gray-700 flex items-center gap-2">{bt.emoji} {bt.label}</span>
                    <span className="font-semibold text-gray-900">
                      {bt.key === result.busType
                        ? <span className="text-blue-600">₹{result.amount} ✓</span>
                        : bt.key === 'AC' ? '₹' + (result.amount + 15) : bt.key === 'electric' ? '₹' + result.amount : '₹' + (result.amount - 5)
                      }
                    </span>
                  </div>
                ))}
              </div>

              {/* Concessions */}
              {result.concessionsAvailable?.length > 0 && (
                <button onClick={() => setShowConcessions(v => !v)}
                  className="w-full flex items-center justify-between text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition">
                  <span className="font-medium">🎫 Available Concessions</span>
                  {showConcessions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
              {showConcessions && (
                <ul className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1.5">
                  {result.concessionsAvailable.map(c => (
                    <li key={c} className="text-sm text-amber-800 flex items-center gap-2">
                      <span className="text-amber-500">✓</span> {c}
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-gray-400 text-center">
                Fares based on official DTC distance slabs. Actual fare may vary slightly by route.
              </p>
            </div>
          </div>
        )}

        {/* FARE TABLE */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-base font-bold text-gray-800">DTC Fare Slab Reference</h2>
            <p className="text-xs text-gray-500 mt-0.5">Official distance-based fare structure for all bus types</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Distance', 'Non-AC', 'AC', 'Electric'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { range: 'Up to 2 km',  nonAC: 10, AC: 15, electric: 10 },
                  { range: 'Up to 5 km',  nonAC: 15, AC: 20, electric: 15 },
                  { range: 'Up to 10 km', nonAC: 20, AC: 30, electric: 20 },
                  { range: 'Up to 15 km', nonAC: 25, AC: 40, electric: 25 },
                  { range: 'Up to 20 km', nonAC: 30, AC: 50, electric: 30 },
                  { range: 'Up to 25 km', nonAC: 35, AC: 60, electric: 35 },
                  { range: 'Up to 30 km', nonAC: 40, AC: 70, electric: 40 },
                  { range: 'Up to 40 km', nonAC: 50, AC: 85, electric: 50 },
                  { range: 'Above 40 km', nonAC: 60, AC: 100, electric: 60 },
                ].map(row => (
                  <tr key={row.range} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{row.range}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">₹{row.nonAC}</td>
                    <td className="px-4 py-3 font-medium text-cyan-700">₹{row.AC}</td>
                    <td className="px-4 py-3 font-medium text-green-700">₹{row.electric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
