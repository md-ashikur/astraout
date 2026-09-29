import React from 'react';
import { Hammer, Sun, Flame, Zap, Sprout, Droplets, Check, Plus, AlertCircle } from 'lucide-react';
import { OutpostLocation, OutpostModule } from '../../engine/simulation-types';
import { soundFx } from '../../audio/sound-synthesizer';

interface ModuleConstructionModalProps {
  isOpen: boolean;
  location: OutpostLocation;
  storedRegolith: number;
  existingModules: OutpostModule[];
  onBuildModule: (template: Partial<OutpostModule>) => void;
  onClose: () => void;
}

interface BuildableTemplate {
  id: string;
  name: string;
  category: OutpostModule['category'];
  powerConsumption: number;
  waterConsumption: number;
  regolithCost: number;
  description: string;
  stemReasoning: string;
  icon: React.ReactNode;
}

export const ModuleConstructionModal: React.FC<ModuleConstructionModalProps> = ({
  isOpen,
  location,
  storedRegolith,
  existingModules,
  onBuildModule,
  onClose,
}) => {
  if (!isOpen) return null;

  const isMoon = location === 'moon';

  const templates: BuildableTemplate[] = [
    {
      id: 'mod-solar-array-2',
      name: 'Auxiliary Ultraflex Solar Wing',
      category: 'power',
      powerConsumption: -12.0,
      waterConsumption: 0,
      regolithCost: 10,
      description: 'Secondary deployable solar array boosting daytime electrical generation.',
      stemReasoning: 'Great for daytime battery charging, but provides 0 kW during lunar night or dust storms.',
      icon: <Sun className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'mod-kilopower-2',
      name: 'Kilopower Fission Reactor Unit 2',
      category: 'power',
      powerConsumption: -10.0,
      waterConsumption: 0,
      regolithCost: 25,
      description: 'Continuous 10 kWe nuclear fission surface power system.',
      stemReasoning: 'Essential baseload power that operates independently of sunlight, dust, or temperature.',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
    },
    {
      id: 'mod-battery-bank-2',
      name: 'Cryo-Tolerant Battery Bank Beta',
      category: 'power',
      powerConsumption: 0.5,
      waterConsumption: 0,
      regolithCost: 12,
      description: 'Adds +50 kWh of high-density solid-state emergency energy storage.',
      stemReasoning: 'Stores peak daytime solar surplus to keep life support humming through the dark.',
      icon: <Zap className="w-5 h-5 text-yellow-300" />,
    },
    {
      id: 'mod-algae-reactor',
      name: 'Spirulina Micro-Algae Photobioreactor',
      category: 'agriculture',
      powerConsumption: 2.0,
      waterConsumption: 1.5,
      regolithCost: 15,
      description: 'Suspended algae tubes absorbing CO2 and churning out high-protein superfood.',
      stemReasoning: 'Micro-algae has a photosynthesis efficiency 4x higher than terrestrial crops.',
      icon: <Sprout className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: isMoon ? 'mod-psr-ice-miner' : 'mod-moxie-isru',
      name: isMoon ? 'Shackleton PSR Ice Thermal Harvester' : 'MOXIE Atmospheric O₂ Extractor',
      category: 'isru',
      powerConsumption: 4.5,
      waterConsumption: 0,
      regolithCost: 20,
      description: isMoon
        ? 'Extracts volatile water ice trapped in deep, permanently shadowed lunar craters.'
        : 'Electrochemically splits atmospheric CO2 into breathable oxygen and carbon monoxide.',
      stemReasoning: 'NASA ISRU allows outposts to "live off the land" rather than shipping water and air from Earth.',
      icon: <Droplets className="w-5 h-5 text-cyan-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 font-mono max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Outpost Engineering & Expansion</h3>
              <p className="text-xs text-slate-400 font-sans">
                Deploy infrastructure modules to scale survival and research capabilities.
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

        {/* Resources Available */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
          <span className="text-slate-400">Available Sintered Regolith:</span>
          <span className="text-purple-300 font-bold text-sm">{storedRegolith} Tons</span>
        </div>

        {/* Templates List */}
        <div className="space-y-3">
          {templates.map((tpl) => {
            const alreadyBuilt = existingModules.some((m) => m.id === tpl.id);
            const canAfford = storedRegolith >= tpl.regolithCost;
            const isGenerator = tpl.powerConsumption < 0;

            return (
              <div
                key={tpl.id}
                className={`p-4 rounded-xl border transition-all ${
                  alreadyBuilt
                    ? 'bg-slate-950/50 border-slate-800 opacity-60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                      {tpl.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">{tpl.name}</h4>
                        <span className="text-[10px] text-cyan-400 uppercase bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans mt-1">
                        {tpl.description}
                      </p>
                      <div className="text-[11px] text-cyan-300 font-sans mt-1 bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20">
                        <span className="font-bold text-cyan-400">Engineering Trade-Off: </span>
                        {tpl.stemReasoning}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-purple-300 font-bold mb-1">
                      {tpl.regolithCost}t Regolith
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      {isGenerator ? `+${Math.abs(tpl.powerConsumption)} kW` : `-${tpl.powerConsumption} kW`}
                    </div>

                    {alreadyBuilt ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5" /> Built
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          soundFx.playSuccess();
                          onBuildModule({
                            id: tpl.id,
                            name: tpl.name,
                            category: tpl.category,
                            level: 1,
                            maxLevel: 3,
                            powerConsumption: tpl.powerConsumption,
                            waterConsumption: tpl.waterConsumption,
                            isActive: true,
                            health: 100,
                            description: tpl.description,
                            techFact: tpl.stemReasoning,
                            buildCost: { regolith: tpl.regolithCost, power: 5 },
                            gridPosition: { x: Math.floor(Math.random() * 5) + 1, y: Math.floor(Math.random() * 5) + 1 },
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          canAfford
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Construct
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
