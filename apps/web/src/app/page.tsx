'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShieldAlert, 
  Building2, 
  Zap, 
  Coins, 
  Terminal, 
  Layers, 
  Database,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const stackItems = [
    {
      title: 'Frontend (Next.js 14)',
      desc: 'App Router, Tailwind CSS, Framer Motion & Recharts for real-time player charts.',
      icon: <Layers className="w-5 h-5 text-[#00FF87]" />,
      status: 'Ready',
      port: ':3000',
    },
    {
      title: 'Backend API (FastAPI)',
      desc: 'Python market calculation engine, AMM liquidity pool & rumor sentiment scoring.',
      icon: <Terminal className="w-5 h-5 text-[#38BDF8]" />,
      status: 'Ready',
      port: ':8000',
    },
    {
      title: 'Database & Auth (Supabase)',
      desc: 'PostgreSQL with Row-Level Security and real-time subscription channels.',
      icon: <Database className="w-5 h-5 text-[#FFD700]" />,
      status: 'Configured',
      port: 'Cloud / Local',
    },
    {
      title: 'Cache & Queue (Redis)',
      desc: 'Sub-second player valuation cache, rate-limiting, and P2P order matching.',
      icon: <Zap className="w-5 h-5 text-[#FF4560]" />,
      status: 'Docker Ready',
      port: ':6379',
    },
  ];

  const modules = [
    {
      name: 'Module A: Live Transfer Terminal',
      tag: 'Journalist Tiers 1-5',
      desc: 'Real-time breaking rumor ticker with the "Deal or Delusion" community consensus gauge.',
      icon: <ShieldAlert className="w-6 h-6 text-[#00FF87]" />,
    },
    {
      name: 'Module B: AMM Transfer Desk',
      tag: 'Liquid Trading',
      desc: 'Automated Market Maker pricing with 3% broker fee, dynamic spreads, and FFP limits.',
      icon: <TrendingUp className="w-6 h-6 text-[#38BDF8]" />,
    },
    {
      name: 'Module C: Club Empire & Facilities',
      tag: 'Sporting Director',
      desc: 'Youth Academy wonderkids, Scouting radar intel, and Commercial Stadium weekly purse dividends.',
      icon: <Building2 className="w-6 h-6 text-[#FFD700]" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#22304A] bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00FF87]/10 border border-[#00FF87]/40 flex items-center justify-center font-bold text-[#00FF87]">
              GD
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Gaffer<span className="text-[#00FF87]">Dex</span>
            </span>
            <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded border border-[#22304A] text-slate-400 font-mono">
              Scaffolding
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-[#161F30] px-3 py-1.5 rounded-full border border-[#22304A]">
              <Coins className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Starting Purse: </span>
              <strong className="text-white font-mono">£100,000,000</strong>
            </div>

            <a
              href="/auth/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </a>

            <a
              href="/auth/signup"
              className="text-xs font-bold bg-[#00FF87] text-black px-4 py-2 rounded-lg hover:bg-[#00e67a] transition-all shadow-sm"
            >
              Found Club
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#00FF87]/10 border border-[#00FF87]/30 text-[#00FF87] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse" />
            Season 2026/27 Live Exchange
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
            The Fantasy Transfer & <span className="text-[#00FF87]">Club Exchange</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Trade real Premier League players with dynamic algorithmic valuations driven by real-world rumors, matchday performance, and market supply & demand.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth/signup"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#00FF87] text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#00e67a] transition-all shadow-lg shadow-[#00FF87]/20"
            >
              <span>Found Your Club (£100M Grant)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#161F30] hover:bg-[#22304A] border border-[#22304A] text-slate-200 font-semibold text-sm transition-colors text-center"
            >
              Sporting Director Dashboard
            </a>
          </div>
        </motion.div>

        {/* Stack Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {stackItems.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="p-5 rounded-xl bg-[#161F30] border border-[#22304A] flex flex-col justify-between hover:border-[#00FF87]/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-[#111827] border border-[#22304A]">
                    {item.icon}
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#111827] text-slate-300 border border-[#22304A]">
                    {item.port}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-base mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#22304A] flex items-center justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className="font-medium text-[#00FF87] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF87]" />
                  {item.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Core Modules Preview */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Core Game Modules</h2>
            <p className="text-sm text-slate-400 mt-1">Foundational architecture ready for feature implementation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map((mod, idx) => (
              <motion.div
                key={mod.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                className="p-6 rounded-xl bg-[#111827] border border-[#22304A] hover:border-slate-600 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-[#161F30] border border-[#22304A]">
                      {mod.icon}
                    </div>
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-[#161F30] text-slate-300 border border-[#22304A]">
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00FF87] transition-colors">
                    {mod.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{mod.desc}</p>
                </div>

                <div className="mt-6 flex items-center text-xs text-slate-400 group-hover:text-white transition-colors">
                  <span>View Documentation</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#22304A] bg-[#111827] py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            <span>GafferDex Monorepo Scaffolding &copy; 2026. Premier League Fantasy Transfer & Club Exchange.</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-slate-400">
            <span>apps/web</span>
            <span>•</span>
            <span>apps/api</span>
            <span>•</span>
            <span>packages/shared-types</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
