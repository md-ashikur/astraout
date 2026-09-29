import React from 'react';
import { CheckCircle2, Circle, Target, Award } from 'lucide-react';
import { MissionObjective } from '../../engine/simulation-types';

interface ObjectivesModalProps {
  isOpen: boolean;
  objectives: MissionObjective[];
  sustainabilityScore: number;
  onClose: () => void;
}

export const ObjectivesModal: React.FC<ObjectivesModalProps> = ({
  isOpen,
  objectives,
  sustainabilityScore,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-100 font-mono max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mission Success Criteria</h3>
              <p className="text-xs text-slate-400 font-sans">
                Core engineering milestones to certify outpost long-duration sustainability.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
          >
            ✕ Close
          </button>
        </div>

        {/* Current Score */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-slate-300">Sustainability Index:</span>
          </div>
          <span className="text-emerald-400 font-bold text-base">{sustainabilityScore}%</span>
        </div>

        {/* Objectives list */}
        <div className="space-y-3">
          {objectives.map((obj) => (
            <div
              key={obj.id}
              className={`p-3.5 rounded-xl border transition-all ${
                obj.completed
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {obj.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <h4
                    className={`text-xs font-bold ${
                      obj.completed ? 'text-emerald-300' : 'text-slate-200'
                    }`}
                  >
                    {obj.title}
                  </h4>
                </div>

                <span className="text-[11px] font-bold text-cyan-300">
                  {obj.currentValue} / {obj.targetValue} {obj.unit}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-sans mb-2 pl-6">
                {obj.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2 ml-6 max-w-[90%]">
                <div
                  className={`h-full rounded-full ${
                    obj.completed ? 'bg-emerald-400' : 'bg-cyan-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (obj.currentValue / obj.targetValue) * 100)}%`,
                  }}
                />
              </div>

              <div className="text-[10px] text-slate-400 font-sans pl-6 italic">
                <span className="text-slate-500 not-italic font-mono">NASA CONTEXT: </span>
                {obj.nasaContext}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
