'use client';

import { useState, useTransition } from 'react';
import { foundClub } from './actions';
import { 
  Shield, 
  Coins, 
  Building, 
  Crown, 
  Flame, 
  Anchor, 
  Target, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Upload
} from 'lucide-react';

const BADGE_PRESETS = [
  { id: 'preset_lion', label: 'Premier Lion', icon: Crown },
  { id: 'preset_shield', label: 'Iron Shield', icon: Shield },
  { id: 'preset_flame', label: 'Red Phoenix', icon: Flame },
  { id: 'preset_anchor', label: 'Harbor Anchor', icon: Anchor },
  { id: 'preset_cannon', label: 'Artillery', icon: Target },
  { id: 'preset_star', label: 'Apex Star', icon: Sparkles },
];

const COLOR_PRESETS = [
  { name: 'Pitch Neon', primary: '#00FF87', secondary: '#0A0E17' },
  { name: 'Royal Crimson', primary: '#E6002B', secondary: '#FFFFFF' },
  { name: 'Sky Dominion', primary: '#6CABDD', secondary: '#1C2C5B' },
  { name: 'Cobalt Gold', primary: '#034694', secondary: '#EEA710' },
  { name: 'Viper Emerald', primary: '#007A3D', secondary: '#F4B223' },
  { name: 'Obsidian Violet', primary: '#6A1B9A', secondary: '#00E5FF' },
];

export default function FoundClubWizard() {
  const [clubName, setClubName] = useState('Apex London FC');
  const [selectedBadge, setSelectedBadge] = useState('preset_lion');
  const [customBadgeUrl, setCustomBadgeUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#00FF87');
  const [secondaryColor, setSecondaryColor] = useState('#0A0E17');
  const [homeGround, setHomeGround] = useState('Apex Arena');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append('club_name', clubName);
    formData.append('badge_url', customBadgeUrl.trim() || selectedBadge);
    formData.append('primary_color', primaryColor);
    formData.append('secondary_color', secondaryColor);
    formData.append('home_ground_name', homeGround);

    startTransition(async () => {
      const result = await foundClub(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const SelectedIcon = BADGE_PRESETS.find(b => b.id === selectedBadge)?.icon || Shield;

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] mb-3">
            <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Grant Approved: £100,000,000</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Found Your Football Club
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Establish your identity, colors, and home stadium before entering the transfer exchange.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Live Club Crest Preview Card */}
          <div className="p-6 rounded-2xl bg-[#161F30] border border-[#22304A] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg border-2"
                style={{ 
                  backgroundColor: secondaryColor, 
                  borderColor: primaryColor,
                  color: primaryColor
                }}
              >
                <SelectedIcon className="w-10 h-10" />
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider font-mono text-slate-400">
                  Virtual Club Identity
                </div>
                <h2 className="text-2xl font-black text-white mt-0.5">
                  {clubName || 'Your Club Name'}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {homeGround || 'Home Ground'}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-[#00FF87]">Premier League</span>
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto bg-[#0A0E17] px-4 py-3 rounded-xl border border-[#22304A] text-right">
              <div className="text-[11px] text-slate-400 uppercase font-mono">Starting Purse</div>
              <div className="text-xl font-mono font-bold text-[#00FF87]">£100,000,000</div>
            </div>
          </div>

          {/* Section 1: Club & Stadium Names */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A] space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00FF87]" />
              1. Club Name & Home Ground
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. Thames United FC"
                  maxLength={64}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:outline-none focus:border-[#00FF87] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Home Ground Stadium
                </label>
                <input
                  type="text"
                  required
                  value={homeGround}
                  onChange={(e) => setHomeGround(e.target.value)}
                  placeholder="e.g. Fortress Park"
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-sm focus:outline-none focus:border-[#00FF87] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Club Badge / Crest */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A] space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#FFD700]" />
              2. Club Crest Badge
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-3">Choose a Crest Preset:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {BADGE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedBadge === preset.id && !customBadgeUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedBadge(preset.id);
                        setCustomBadgeUrl('');
                      }}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        isSelected 
                          ? 'border-[#00FF87] bg-[#00FF87]/10 text-[#00FF87]' 
                          : 'border-[#22304A] bg-[#0A0E17] text-slate-400 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-[11px] font-medium">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#22304A]">
              <label className="block text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Or enter custom badge image URL:
              </label>
              <input
                type="url"
                value={customBadgeUrl}
                onChange={(e) => setCustomBadgeUrl(e.target.value)}
                placeholder="https://example.com/crest.png"
                className="w-full px-4 py-2 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#00FF87]"
              />
            </div>
          </div>

          {/* Section 3: Club Colors */}
          <div className="p-6 rounded-2xl bg-[#111827] border border-[#22304A] space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              3. Official Club Colors
            </h3>

            {/* Presets */}
            <div>
              <label className="block text-xs text-slate-400 mb-3">Popular Color Schemes:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {COLOR_PRESETS.map((scheme) => (
                  <button
                    key={scheme.name}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(scheme.primary);
                      setSecondaryColor(scheme.secondary);
                    }}
                    className="p-2.5 rounded-lg border border-[#22304A] bg-[#0A0E17] flex items-center gap-2.5 hover:border-slate-500 text-xs text-slate-300"
                  >
                    <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: scheme.primary }} />
                      <div className="w-4 h-4 rounded-full border border-black/40" style={{ backgroundColor: scheme.secondary }} />
                    </div>
                    <span>{scheme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#22304A]">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Primary Color (Accent)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Secondary Color (Base)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-lg bg-[#0A0E17] border border-[#22304A] text-white font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 px-6 rounded-xl bg-[#00FF87] text-black font-extrabold text-base flex items-center justify-center gap-3 hover:bg-[#00e67a] active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-[#00FF87]/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Founding Club & Provisioning £100M Purse...</span>
                </>
              ) : (
                <>
                  <span>Found Club & Enter Transfer Market</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
