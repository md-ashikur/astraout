import React from 'react';
import { Sprout, Droplets, Utensils, Sparkles } from 'lucide-react';
import { OutpostResources } from '../../engine/simulation-types';

interface FoodWaterGaugeProps {
  resources: OutpostResources;
}

export const FoodWaterGauge: React.FC<FoodWaterGaugeProps> = ({ resources }) => {
  const isFoodLow = resources.foodRations < 24;
  const isWaterLow = resources.waterReserve < 100;

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3.5 backdrop-blur-md shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Food & Water Closed-Loop
            </h3>
            <div className="text-[10px] text-slate-400 font-mono">
              Hydroponics & Distillation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            <Droplets className="w-3 h-3 text-cyan-400" />
            {resources.waterRecyclingEfficiency}% Recycled
          </span>
        </div>
      </div>

      {/* Crop Growth Progress Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Crop Harvest Growth
          </span>
          <span className="font-bold text-emerald-400">
            {resources.cropHarvestProgress}% (Health: {resources.cropHealth}%)
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500"
            style={{ width: `${resources.cropHarvestProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Potatoes & Microgreens</span>
          <span>+{resources.dailyCalorieOutput} kcal/day</span>
        </div>
      </div>

      {/* Rations & Water Reserve */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-center">
        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Utensils className="w-3 h-3 text-emerald-400" />
            Rations Available
          </div>
          <div
            className={`text-xs font-bold ${
              isFoodLow ? 'text-rose-400 animate-pulse' : 'text-emerald-300'
            }`}
          >
            {resources.foodRations} meals
          </div>
          <div className="text-[9px] text-slate-500">
            ~{Math.round(resources.foodRations / 12)} days reserve
          </div>
        </div>

        <div className="bg-slate-950/60 rounded-lg p-1.5 border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            Water Reserve
          </div>
          <div
            className={`text-xs font-bold ${
              isWaterLow ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
            }`}
          >
            {resources.waterReserve} L
          </div>
          <div className="text-[9px] text-slate-500">Cap: {resources.waterCapacity} L</div>
        </div>
      </div>
    </div>
  );
};
