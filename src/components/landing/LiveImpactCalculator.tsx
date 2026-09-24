'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Leaf, Utensils, Clock } from 'lucide-react';
import { CONFIG, SHELF_LIFE_HOURS } from '@/lib/config';

export function LiveImpactCalculator() {
  const [category, setCategory] = useState<'cooked_meal' | 'bakery' | 'sweets' | 'packaged' | 'raw_produce'>('cooked_meal');
  const [kg, setKg] = useState<number>(25);

  const shelfLife = SHELF_LIFE_HOURS[category] || 4;
  const meals = Math.round(kg / CONFIG.KG_PER_MEAL);
  const co2e = Math.round(kg * CONFIG.CO2E_KG_PER_KG_FOOD * 10) / 10;
  const carKm = Math.round(co2e * 4.2);

  const categories = [
    { id: 'cooked_meal', label: 'Cooked Meals', icon: '🍲', hours: 4 },
    { id: 'bakery', label: 'Bakery & Bread', icon: '🥖', hours: 12 },
    { id: 'sweets', label: 'Sweets & Desserts', icon: '🧁', hours: 12 },
    { id: 'packaged', label: 'Packaged Food', icon: '📦', hours: 72 },
    { id: 'raw_produce', label: 'Fresh Produce', icon: '🥦', hours: 24 },
  ];

  return (
    <div className="w-full bg-gradient-to-br from-[#2B1B54] via-[#1E1035] to-[#120726] rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-2xl border-2 border-purple-500/20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-black uppercase px-3.5 py-1.5 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Interactive Rescue Simulator
            </div>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
              See Your Impact Before You Post
            </h3>
            <p className="text-purple-200/80 text-sm mt-1">
              Select your surplus category and batch size to see live FSSAI safe time windows and community impact.
            </p>
          </div>
          <span className="text-xs font-bold text-purple-300/60 bg-purple-900/40 px-3 py-1.5 rounded-lg border border-purple-500/20">
            FSSAI & EPA Verified Formula
          </span>
        </div>

        {/* Category Picker Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-8">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id as any)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                category === c.id
                  ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/50 scale-[1.02]'
                  : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl mb-1">{c.icon}</span>
              <div>
                <div className="text-xs font-black">{c.label}</div>
                <div className="text-[10px] text-purple-200/70">{c.hours}h max window</div>
              </div>
            </button>
          ))}
        </div>

        {/* Quantity Slider */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-purple-300">
              Estimated Surplus Weight
            </span>
            <span className="text-2xl font-black text-amber-400">
              {kg} <span className="text-sm font-bold text-purple-200">kg</span>
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={kg}
            onChange={(e) => setKg(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-2 bg-purple-950 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-purple-300/60 mt-2 font-mono">
            <span>5 kg (Small cafe batch)</span>
            <span>50 kg (Standard banquet)</span>
            <span>200 kg (Large hotel buffet)</span>
          </div>
        </div>

        {/* Live Metrics Output Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
              {meals}
            </div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">
              Meals Rescued
            </div>
            <div className="text-[10px] text-purple-200/70 mt-0.5">Feeds hungry families</div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {co2e} <span className="text-base font-bold">kg</span>
            </div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">
              CO2e Diverted
            </div>
            <div className="text-[10px] text-purple-200/70 mt-0.5">Kept out of landfills</div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-3xl sm:text-4xl font-black text-sky-400 tracking-tight flex items-center justify-center gap-1">
              <Clock className="w-6 h-6 text-sky-400" />
              <span>{shelfLife}h</span>
            </div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">
              Safe Window
            </div>
            <div className="text-[10px] text-purple-200/70 mt-0.5">Strict FSSAI compliance</div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-3xl sm:text-4xl font-black text-pink-400 tracking-tight">
              ~{carKm} <span className="text-base font-bold">km</span>
            </div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">
              Car Travel Saved
            </div>
            <div className="text-[10px] text-purple-200/70 mt-0.5">Equivalent emissions</div>
          </div>
        </div>

        {/* CTA Banner inside calculator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div className="text-xs text-purple-200">
              <span className="font-bold text-white">Guaranteed Fast Dispatch:</span> Average matching speed is <strong>42 seconds</strong> across verified Jaipur shelters.
            </div>
          </div>
          <Link
            href="/restaurant/signup"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <span>Post This Batch Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
