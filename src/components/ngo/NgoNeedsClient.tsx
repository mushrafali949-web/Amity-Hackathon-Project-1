'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createNgoNeedAction, closeNgoNeedAction } from '@/lib/actions/ngo';
import { DietType, UrgencyLevel } from '@/types/database';
import { DIET_LABELS } from '@/lib/config';
import { formatTimeAgo } from '@/lib/utils';
import {
  Megaphone,
  Plus,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface NgoNeedsClientProps {
  ngo: any;
  initialNeeds: any[];
}

export function NgoNeedsClient({ ngo, initialNeeds }: NgoNeedsClientProps) {
  const router = useRouter();
  const [needs, setNeeds] = useState(initialNeeds);
  const [showModal, setShowModal] = useState(false);

  // New Need Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mealsNeeded, setMealsNeeded] = useState<number>(50);
  const [diet, setDiet] = useState<DietType>('mixed');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [neededBy, setNeededBy] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title) {
      toast.error('Please enter a request title');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createNgoNeedAction({
        title,
        description,
        mealsNeeded,
        diet,
        urgency,
        neededBy: neededBy ? new Date(neededBy).toISOString() : undefined,
      });

      if (res.success) {
        toast.success('Urgent request broadcast to nearby restaurants!');
        setShowModal(false);
        setTitle('');
        setDescription('');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to broadcast need');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(needId: string) {
    try {
      const res = await closeNgoNeedAction(needId);
      if (res.success) {
        toast.success('Need marked as fulfilled/closed');
        router.refresh();
      }
    } catch {
      toast.error('Failed to close need');
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Broadcast Urgent Needs
          </h1>
          <p className="text-xs text-stone-500">
            Tell local restaurant kitchens what your shelter or orphanage needs today
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Urgent Request
        </button>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-600" /> Broadcast Food Need
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Title / Requirement
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 60 Dinner Meals for Night Shelter"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Meals Needed
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1000}
                    required
                    value={mealsNeeded}
                    onChange={(e) => setMealsNeeded(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-400">~{Math.round(mealsNeeded * 0.5)} kg</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="low">Low (Standard)</option>
                    <option value="medium">Medium (Today)</option>
                    <option value="high">High (Urgent Needed)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Diet Preference
                  </label>
                  <select
                    value={diet}
                    onChange={(e) => setDiet(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs"
                  >
                    {Object.entries(DIET_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Needed By (Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={neededBy}
                    onChange={(e) => setNeededBy(e.target.value)}
                    className="w-full px-2 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Vegetarian preferred, containers available on site"
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-stone-600 hover:text-stone-900 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Broadcasting...' : 'Broadcast to Restaurants'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Needs List */}
      {needs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {needs.map((item: any) => {
            const isHigh = item.urgency === 'high';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between space-y-4 ${
                  item.active ? 'border-stone-200' : 'border-stone-200 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        !item.active
                          ? 'bg-stone-100 text-stone-600'
                          : isHigh
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.active ? (isHigh ? 'High Urgency' : 'Active Request') : 'Fulfilled / Closed'}
                    </span>

                    <span className="text-[11px] text-stone-400">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-lg text-stone-900 leading-snug">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-stone-600 mt-1">{item.description}</p>
                    )}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl flex items-center justify-between text-xs text-stone-700">
                    <div>
                      <span className="text-stone-500">Target: </span>
                      <strong className="text-stone-900">{item.meals_needed} meals</strong>
                    </div>
                    <div className="font-semibold">{DIET_LABELS[item.diet] || item.diet}</div>
                  </div>
                </div>

                {item.active && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleClose(item.id)}
                      className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 font-bold transition-colors"
                    >
                      Mark as Fulfilled
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
          <Megaphone className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No needs broadcast yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Broadcasting your daily food requirements alerts participating restaurant kitchens and
            allows them to donate directly to you.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4" /> Create First Broadcast
          </button>
        </div>
      )}
    </div>
  );
}
