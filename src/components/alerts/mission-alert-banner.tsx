import React from 'react';
import { AlertTriangle, ShieldAlert, ZapOff, Wind, Wrench } from 'lucide-react';
import { SpaceHazard } from '../../engine/simulation-types';
import { soundFx } from '../../audio/sound-synthesizer';

interface MissionAlertBannerProps {
  hazards: SpaceHazard[];
  onOpenStormShelter: () => void;
  onOpenPowerGrid: () => void;
}

export const MissionAlertBanner: React.FC<MissionAlertBannerProps> = ({
  hazards,
  onOpenStormShelter,
  onOpenPowerGrid,
}) => {
  if (hazards.length === 0) return null;

  return (
    <div className="w-full space-y-2 p-3 bg-red-950/40 border-y border-red-500/50 backdrop-blur-md">
      {hazards.map((hazard) => {
        const isSevere = hazard.severity === 'severe' || hazard.severity === 'catastrophic';

        return (
          <div
            key={hazard.id}
            className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
              isSevere
                ? 'bg-red-950/80 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-amber-950/80 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isSevere ? 'bg-red-900 text-red-200' : 'bg-amber-900 text-amber-200'
                }`}
              >
                {hazard.type === 'solar-flare' && <ShieldAlert className="w-5 h-5 animate-bounce" />}
                {hazard.type === 'dust-storm' && <Wind className="w-5 h-5" />}
                {hazard.type === 'micrometeoroid' && <AlertTriangle className="w-5 h-5" />}
                {hazard.type === 'system-fault' && <Wrench className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase font-black px-1.5 py-0.5 rounded ${
                      isSevere ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    {hazard.severity} ALERT
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    {hazard.title}
                  </h4>
                  <span className="text-xs font-mono text-slate-300">
                    Duration: ~{hazard.durationRemainingSols} Sols
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                  {hazard.description}
                </p>
                <div className="text-[11px] font-mono text-cyan-300 mt-1 flex items-center gap-1">
                  <span className="text-slate-400 font-sans font-bold">NASA PROTOCOL:</span>
                  <span>{hazard.nasaRemedy}</span>
                </div>
              </div>
            </div>

            {/* Action buttons depending on hazard */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              {hazard.type === 'solar-flare' && (
                <button
                  onClick={() => {
                    soundFx.playAlarm();
                    onOpenStormShelter();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Order Storm Shelter
                </button>
              )}

              {hazard.type === 'dust-storm' && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onOpenPowerGrid();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
                >
                  <ZapOff className="w-4 h-4" />
                  Power Grid Priority
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
