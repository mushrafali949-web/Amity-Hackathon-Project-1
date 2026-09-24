'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ImpactStats } from '@/lib/impact';
import { CONFIG } from '@/lib/config';
import {
  Download,
  Flame,
  Leaf,
  CheckCircle2,
  Calendar,
  Building,
  Info,
} from 'lucide-react';

interface NgoImpactClientProps {
  ngo: any;
  donations: any[];
  stats: ImpactStats;
}

export function NgoImpactClient({ ngo, donations, stats }: NgoImpactClientProps) {
  // Aggregate monthly data for chart
  const monthsMap: Record<string, { month: string; meals: number; kg: number }> = {};

  donations.forEach((d) => {
    const date = new Date(d.delivered_at || d.created_at);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const weight = d.actual_kg_received ?? d.quantity_kg ?? 0;
    const meals = Math.round(weight / CONFIG.KG_PER_MEAL);

    if (!monthsMap[monthKey]) {
      monthsMap[monthKey] = { month: monthKey, meals: 0, kg: 0 };
    }
    monthsMap[monthKey].meals += meals;
    monthsMap[monthKey].kg += weight;
  });

  const chartData = Object.values(monthsMap).slice(-6);
  if (chartData.length === 0) {
    chartData.push({ month: 'This Month', meals: stats.totalMeals, kg: stats.totalKg });
  }

  function downloadCsv() {
    if (donations.length === 0) return;
    const headers = ['Donation ID', 'Title', 'Donor Restaurant', 'City', 'Kg Received', 'Meals Served', 'Date Delivered'];
    const rows = donations.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.restaurants?.name || ''}"`,
      `"${d.restaurants?.city || ''}"`,
      d.actual_kg_received ?? d.quantity_kg,
      Math.round((d.actual_kg_received ?? d.quantity_kg) / CONFIG.KG_PER_MEAL),
      d.delivered_at || d.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ngo_impact_${ngo?.name || 'relief'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            NGO Community Impact Report
          </h1>
          <p className="text-xs text-stone-500">
            Certified rescued food distributed by {ngo?.name || 'Your Organization'}
          </p>
        </div>

        {donations.length > 0 && (
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition-all"
          >
            <Download className="w-4 h-4" /> Export Operations Data (CSV)
          </button>
        )}
      </div>

      {/* 3 Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl font-black text-stone-900">{stats.totalMeals}</div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-0.5">
              Meals Served
            </div>
            <div className="text-[11px] text-stone-400 mt-1">To hungry families & shelters</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl font-black text-stone-900">{stats.totalKg} kg</div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-0.5">
              Food Rescued
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Verified received across {stats.completedDonationsCount} rescues
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
            <Leaf className="w-7 h-7" />
          </div>
          <div>
            <div className="text-3xl font-black text-stone-900">{stats.totalCo2eKg} kg</div>
            <div className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-0.5">
              CO2e Avoided
            </div>
            <div className="text-[11px] text-stone-400 mt-1">Greenhouse gas diverted</div>
          </div>
        </div>
      </div>

      {/* Trajectory Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" /> Community Distribution Trajectory
        </h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eeee" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#78716c' }} />
              <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="meals" fill="#0d9488" radius={[8, 8, 0, 0]} name="Meals Served" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donor Restaurant Partners Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-base font-black text-stone-900">
          Donor Restaurant Partners ({donations.length})
        </h2>

        {donations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-y border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Donation Title</th>
                  <th className="py-3 px-4">Donor Restaurant</th>
                  <th className="py-3 px-4">Weight Confirmed</th>
                  <th className="py-3 px-4">Servings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {donations.map((d) => {
                  const weight = d.actual_kg_received ?? d.quantity_kg;
                  const meals = Math.round(weight / CONFIG.KG_PER_MEAL);
                  const dateStr = d.delivered_at
                    ? new Date(d.delivered_at).toLocaleDateString()
                    : new Date(d.created_at).toLocaleDateString();

                  return (
                    <tr key={d.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">{d.title}</td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {d.restaurants?.name || 'Restaurant Donor'} ({d.restaurants?.city})
                      </td>
                      <td className="py-3.5 px-4 font-bold text-teal-700">{weight} kg</td>
                      <td className="py-3.5 px-4 text-stone-600">~{meals} meals</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-stone-500">
            No completed deliveries logged yet. Complete pickups from active dispatches to view your
            donors and impact records.
          </div>
        )}
      </div>

      {/* Assumptions Footnote */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex items-start gap-2.5 text-xs text-teal-900">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Impact Calculation Methodology & Footnote:</p>
          <p className="text-[11px] text-teal-800 leading-relaxed">
            All metrics represent physical food collected and verified by your teams upon arrival.
            Meals are computed using {CONFIG.KG_PER_MEAL} kg per portion. Greenhouse gas prevention
            is estimated at {CONFIG.CO2E_KG_PER_KG_FOOD} kg CO2e per kg food diverted from
            landfills.
          </p>
        </div>
      </div>
    </div>
  );
}
