/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Game "Tầm Phục Ký - Việt Phục Remix"
 * Điểm vào ứng dụng chính: Chỉ mount GameShell toàn màn hình và DevPanel ẩn.
 */

import React, { useState, useEffect } from 'react';
import { GameShell } from '../client/src/game/GameShell.tsx';
import { DevPanel } from '../client/src/game/DevPanel.tsx';

export default function App() {
  const [isDevOpen, setIsDevOpen] = useState(false);

  // Mở Dev Panel nếu URL có ?dev=1
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('dev=1')) {
      setIsDevOpen(true);
    }
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0f0d1b] select-none m-0 p-0">
      <GameShell
        onToggleDevPanel={() => setIsDevOpen((prev) => !prev)}
        isDevPanelOpen={isDevOpen}
      />
      <DevPanel
        isOpen={isDevOpen}
        onClose={() => setIsDevOpen(false)}
      />
    </div>
  );
}
