'use client';

import { useState } from 'react';
import JoinLeagueModal from './JoinLeagueModal';

interface LeaderboardsClientProps {
  children: React.ReactNode;
}

export default function LeaderboardsClient({ children }: LeaderboardsClientProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <>
      {children}
      <JoinLeagueModal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => window.location.reload()}
      />
      <button
        onClick={() => setShowJoinModal(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-full bg-[#38BDF8] text-black font-bold text-sm hover:bg-sky-400 transition-all shadow-lg"
      >
        <span>Join League</span>
      </button>
    </>
  );
}
