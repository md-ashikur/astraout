import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, AlertTriangle, RotateCcw, Compass } from 'lucide-react';
import { OutpostLocation, OutpostState } from '../../engine/simulation-types';
import { soundFx } from '../../audio/sound-synthesizer';

interface MissionDebriefModalProps {
  state: OutpostState;
  onRestart: (location: OutpostLocation) => void;
}

export const MissionDebriefModal: React.FC<MissionDebriefModalProps> = ({ state, onRestart }) => {
  const { gameWon, endCause, sustainabilityScore, location, currentSol } = state;

  useEffect(() => {
    if (gameWon) {
      soundFx.playSuccess();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } else {
      soundFx.playAlarm();
    }
  }, [gameWon]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <div
        className={`bg-slate-900 border rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 font-mono text-center ${
          gameWon ? 'border-emerald-500/50 shadow-emerald-950/50' : 'border-rose-500/50 shadow-rose-950/50'
        }`}
      >
        {/* Badge Icon */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border ${
              gameWon
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                : 'bg-rose-950/80 border-rose-400 text-rose-300'
            }`}
          >
            {gameWon ? <Award className="w-9 h-9" /> : <AlertTriangle className="w-9 h-9" />}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold tracking-tight text-white mb-1">
          {gameWon ? 'MISSION CERTIFICATION ACHIEVED' : 'MISSION ABORTED'}
        </h2>
        <div className="text-xs text-slate-400 mb-4">
          Duration: <span className="font-bold text-slate-200">SOL {currentSol}</span> on{' '}
          <span className="font-bold text-cyan-300 uppercase">{location}</span>
        </div>

        {/* Cause message */}
        <div
          className={`p-3.5 rounded-xl border text-xs font-sans mb-4 leading-relaxed ${
            gameWon
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {endCause}
        </div>

        {/* Final Score Report Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-5 text-left space-y-2">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
            Flight Surgeon & Systems Debrief
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300">Overall Sustainability Score:</span>
            <span
              className={`font-bold ${
                sustainabilityScore >= 70
                  ? 'text-emerald-400'
                  : sustainabilityScore >= 40
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {sustainabilityScore}%
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300">Regolith Shield Depth:</span>
            <span className="font-bold text-purple-300">
              {state.resources.shieldingThicknessCm} cm
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300">Active Crew Vitals:</span>
            <span className="font-bold text-cyan-300">
              {state.crew.filter((c) => c.status !== 'incapacitated').length} / {state.crew.length} Healthy
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRestart(location)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Mission
          </button>

          <button
            onClick={() => onRestart(location === 'moon' ? 'mars' : 'moon')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            Switch to {location === 'moon' ? 'Mars' : 'Moon'}
          </button>
        </div>
      </div>
    </div>
  );
};
