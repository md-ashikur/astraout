import React from 'react';
import { Users, Heart, Smile, BatteryCharging, Radio, Shield, Wrench, Bed } from 'lucide-react';
import { Astronaut } from '../../engine/simulation-types';
import { soundFx } from '../../audio/sound-synthesizer';

interface CrewManagementModalProps {
  isOpen: boolean;
  crew: Astronaut[];
  onAssignCrew: (id: string, status: Astronaut['status']) => void;
  onClose: () => void;
}

export const CrewManagementModal: React.FC<CrewManagementModalProps> = ({
  isOpen,
  crew,
  onAssignCrew,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl text-slate-100 font-mono max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Crew Bio-Telemetry & Assignments</h3>
              <p className="text-xs text-slate-400 font-sans">
                Monitor astronaut vital signs, fatigue levels, and accumulated radiation doses.
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

        {/* Astronaut Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {crew.map((member) => {
            const isHighRadiation = member.radiationDose > 100;
            const isHighFatigue = member.fatigue > 75;

            return (
              <div
                key={member.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-1.5 rounded-xl bg-slate-900 border border-slate-700">
                        {member.avatar}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{member.name}</h4>
                        <div className="text-[11px] text-cyan-400">{member.role}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        member.status === 'eva-repair'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : member.status === 'sheltered'
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                          : member.status === 'resting'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans mb-3 bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="font-bold text-slate-300">Specialty: </span>
                    {member.specialtySkill}
                  </p>

                  {/* Vitals Bar Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-400" /> Health
                        </span>
                        <span className="font-bold text-emerald-400">{member.health}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${member.health}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Smile className="w-3 h-3 text-cyan-400" /> Morale
                        </span>
                        <span className="font-bold text-cyan-300">{member.morale}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${member.morale}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <BatteryCharging className="w-3 h-3 text-amber-400" /> Fatigue
                        </span>
                        <span className={`font-bold ${isHighFatigue ? 'text-rose-400' : 'text-amber-300'}`}>
                          {member.fatigue}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isHighFatigue ? 'bg-rose-500' : 'bg-amber-400'}`}
                          style={{ width: `${member.fatigue}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Radio className="w-3 h-3 text-purple-400" /> Radiation
                        </span>
                        <span className={`font-bold ${isHighRadiation ? 'text-rose-400' : 'text-purple-300'}`}>
                          {member.radiationDose} mSv
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isHighRadiation ? 'bg-rose-500' : 'bg-purple-500'}`}
                          style={{ width: `${Math.min(100, (member.radiationDose / 250) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Selector */}
                <div className="flex items-center gap-1 pt-2 border-t border-slate-800 text-[10px]">
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onAssignCrew(member.id, 'active');
                    }}
                    className={`flex-1 py-1 rounded transition-all ${
                      member.status === 'active'
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Duty
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onAssignCrew(member.id, 'resting');
                    }}
                    className={`flex-1 py-1 rounded transition-all flex items-center justify-center gap-1 ${
                      member.status === 'resting'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Bed className="w-3 h-3" /> Rest
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onAssignCrew(member.id, 'eva-repair');
                    }}
                    className={`flex-1 py-1 rounded transition-all flex items-center justify-center gap-1 ${
                      member.status === 'eva-repair'
                        ? 'bg-amber-600 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Wrench className="w-3 h-3" /> EVA
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      onAssignCrew(member.id, 'sheltered');
                    }}
                    className={`flex-1 py-1 rounded transition-all flex items-center justify-center gap-1 ${
                      member.status === 'sheltered'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-3 h-3" /> Shelter
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
