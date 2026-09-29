import React, { useState } from 'react';
import { BookOpen, Zap, Wind, Radio, Sprout, Compass, ExternalLink } from 'lucide-react';

interface NasaFieldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NasaFieldGuideModal: React.FC<NasaFieldGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'power' | 'eclss' | 'radiation' | 'food' | 'moon-vs-mars'>('power');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl text-slate-100 font-mono max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                NASA Junior Astronaut STEM Field Guide
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Real-world engineering trade-offs behind Moon and Mars outpost survival.
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 mb-4 text-xs">
          <button
            onClick={() => setActiveTab('power')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'power'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            1. Power Dilemma
          </button>

          <button
            onClick={() => setActiveTab('eclss')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'eclss'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            2. Life Support (ECLSS)
          </button>

          <button
            onClick={() => setActiveTab('radiation')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'radiation'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            3. Radiation & Regolith
          </button>

          <button
            onClick={() => setActiveTab('food')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'food'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            4. Food & Water Loops
          </button>

          <button
            onClick={() => setActiveTab('moon-vs-mars')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'moon-vs-mars'
                ? 'bg-blue-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            5. Moon vs Mars
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 text-xs font-sans text-slate-300 space-y-4">
          {activeTab === 'power' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold font-mono text-amber-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                The Power Dilemma: Solar Wings vs Nuclear Fission
              </h4>
              <p>
                Every watt generated on the Moon or Mars determines whether life support, heating, and communications stay alive.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-mono font-bold text-amber-400 text-xs mb-1">
                    Solar Photovoltaic (PV) Panels
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li><strong className="text-white">Advantage:</strong> Lightweight, reliable, zero radioactive material required.</li>
                    <li><strong className="text-rose-400">The Catch:</strong> The Moon experiences a 14-day night of pitch blackness! On Mars, towering planet-wide dust storms can block 85-99% of sunlight for months (which ended the Opportunity rover mission in 2018).</li>
                  </ul>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="font-mono font-bold text-orange-400 text-xs mb-1">
                    NASA Kilopower (KRUSTY Fission)
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li><strong className="text-white">Advantage:</strong> Continuous 10 kWe of steady electrical baseload 24/7/365, completely unaffected by darkness, dust storms, or cold.</li>
                    <li><strong className="text-amber-400">The Catch:</strong> Heavy mass penalty for rocket launch; requires heat pipes and radiator panels to reject waste heat into space vacuum.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eclss' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold font-mono text-cyan-300 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-400" />
                Closing the Air Loop: Environmental Control & Life Support (ECLSS)
              </h4>
              <p>
                Human beings consume ~0.84 kg of oxygen per day and exhale ~1.0 kg of carbon dioxide. In an airtight space habitat, exhaled CO2 builds up quickly without scrubbers.
              </p>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-white text-xs">The Chemical Reaction: Sabatier System</div>
                <div className="p-2 rounded bg-slate-900 font-mono text-cyan-300 text-center text-xs">
                  CO₂ + 4 H₂ → CH₄ (Methane) + 2 H₂O (Water)
                </div>
                <p className="text-[11px] text-slate-400">
                  Then, electrolysis splits that water into fresh O2 to breathe: <code className="text-cyan-300">2 H₂O → 2 H₂ + O₂</code>. On Mars, NASA&apos;s MOXIE instrument on the Perseverance rover tests direct CO2 solid oxide electrolysis (<code className="text-cyan-300">2 CO₂ → 2 CO + O₂</code>).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'radiation' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold font-mono text-purple-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-purple-400" />
                Deep Space Radiation & In-Situ Regolith Shielding
              </h4>
              <p>
                Unlike Earth, neither the Moon nor Mars has a strong global magnetosphere or thick atmosphere to deflect Galactic Cosmic Rays (GCR) and Coronal Mass Ejections (CME) from the Sun.
              </p>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-white text-xs">Why Sintered Regolith 3D Printing?</div>
                <p>
                  Shipping lead or heavy steel shielding from Earth would require dozens of expensive heavy-lift rockets. Instead, NASA plans to use robotic rovers that microwave or sinter lunar and martian soil (regolith) into thick 40-50 cm interlocking outer shells.
                </p>
                <div className="p-2 rounded bg-slate-900 text-purple-300 text-xs font-mono">
                  ★ 50 cm of sintered regolith blocks ~85-90% of cosmic radiation!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'food' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold font-mono text-emerald-300 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-400" />
                Bio-Regenerative Life Support: Space Agriculture
              </h4>
              <p>
                Each astronaut requires approximately 2,500 to 3,000 calories per day. Over a 3-year Mars mission, packing all pre-packaged meals would require over 10 tons of food mass per 4-person crew!
              </p>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-white text-xs">Veggie & Aeroponic Crop Racks</div>
                <p>
                  NASA tests plant growth using aeroponics (misting plant roots with nutrient water rather than heavy soil) and high-efficiency LED grow lights that output red and blue wavelengths optimized for photosynthesis.
                </p>
                <p>
                  Crops like microgreens, dwarf wheat, sweet potatoes, and spirulina algae not only provide essential vitamins and antioxidants to protect astronaut eyesight and DNA, but also recycle CO2 into fresh oxygen!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'moon-vs-mars' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold font-mono text-blue-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-400" />
                Comparing Worlds: The Moon vs Mars
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border border-slate-800">
                  <thead className="bg-slate-950 text-cyan-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Parameter</th>
                      <th className="p-2">The Moon (Artemis)</th>
                      <th className="p-2">Mars (Ares)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    <tr>
                      <td className="p-2 font-bold text-white">Day / Night Cycle</td>
                      <td className="p-2">29.5 Earth days (14d Sun, 14d Night)</td>
                      <td className="p-2">24h 39m Sol (very close to Earth!)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-white">Atmosphere</td>
                      <td className="p-2">Hard Vacuum (0 kPa)</td>
                      <td className="p-2">Thin CO₂ (~0.6 kPa)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-white">Temperature Extreme</td>
                      <td className="p-2">-170°C to +120°C</td>
                      <td className="p-2">-90°C to +20°C</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-white">Comm Delay to Earth</td>
                      <td className="p-2">1.3 seconds (real-time voice)</td>
                      <td className="p-2">4 to 24 minutes (crew must be autonomous)</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-white">Key Resource (ISRU)</td>
                      <td className="p-2">Water ice in South Pole craters</td>
                      <td className="p-2">Atmospheric CO₂ & subsurface permafrost</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
