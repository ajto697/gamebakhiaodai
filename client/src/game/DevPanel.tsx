/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * BẢNG ĐIỀU KHIỂN DÀNH CHO NHÀ PHÁT TRIỂN (DEV PANEL OVERLAY)
 * Chỉ mở bằng phím F1 hoặc query ?dev=1.
 * Chứa: Bộ chuyển màn (Scene Warp), Sân chơi Remix Phối Đồ, Bảng 32 Màu, Thử /api/judge.
 */

import React, { useState } from 'react';
import { SceneManager } from './sceneManager.ts';
import { PALETTE } from '../art/palette.ts';
import { OutfitSelection } from '../art/paperdoll.ts';
import { AlbumStorage } from '../art/albumStorage.ts';

interface DevPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({ isOpen, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'warp' | 'remix' | 'palette' | 'judge'>('warp');
  const sceneMgr = SceneManager.getInstance();

  // State cho Thử /api/judge
  const [testEvent, setTestEvent] = useState('di_tich_hue');
  const [testAo, setTestAo] = useState('ao_ngu_than');
  const [testQuan, setTestQuan] = useState('quan_lua_ong_rong');
  const [testPhuKien, setTestPhuKien] = useState<string[]>(['khan_dong']);
  const [evaluating, setEvaluating] = useState(false);
  const [judgeResult, setJudgeResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleWarp = (scene: any, levelId?: string) => {
    sceneMgr.changeScene(scene, levelId);
    onClose();
  };

  const handleRunJudgeTest = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: testEvent,
          outfit: {
            ao: testAo,
            quan_vay: testQuan,
            phu_kien: testPhuKien,
            mau_sac: 'tim_hue',
            phong_cach: 'co_phuc_remix',
          },
        }),
      });
      const data = await res.json();
      setJudgeResult(data);
    } catch (e) {
      console.error('Lỗi khi gọi /api/judge:', e);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-amber-100 font-sans">
        {/* Header của Dev Panel */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold tracking-wider text-amber-300 font-mono">
              [DEV TOOLS] BẢNG ĐIỀU KHIỂN &amp; KIỂM THỬ VĂN HÓA (F1)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono"
          >
            ĐÓNG [ESC / F1]
          </button>
        </div>

        {/* Tab chuyển đổi trong Dev Panel */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-4 pt-2 gap-2 text-xs">
          {[
            { id: 'warp', label: '🚀 Chuyển Cảnh / Màn' },
            { id: 'palette', label: '🎨 Bảng 32 Màu' },
            { id: 'judge', label: '⚖️ Thử /api/judge' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-t-lg font-bold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-slate-900 text-amber-300 border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Nội dung chi tiết */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: WARP SCENE */}
          {activeSubTab === 'warp' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-300">Nhảy trực tiếp đến màn chơi / cảnh game:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleWarp('TITLE')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold border border-slate-700 text-left transition-all"
                >
                  📺 Màn Hình Tiêu Đề (TITLE)
                </button>
                <button
                  onClick={() => handleWarp('CHAPTER_MAP')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold border border-slate-700 text-left transition-all"
                >
                  🗺️ Bản Đồ Cố Đô (CHAPTER_MAP)
                </button>
                <button
                  onClick={() => handleWarp('LEVEL', 'c1_m1')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold border border-slate-700 text-left transition-all"
                >
                  ⚔️ Màn 1: Ngọ Môn (c1_m1)
                </button>
                <button
                  onClick={() => handleWarp('LEVEL', 'c1_m2')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold border border-slate-700 text-left transition-all"
                >
                  ⚔️ Màn 2: Sông Hương (c1_m2)
                </button>
                <button
                  onClick={() => handleWarp('LEVEL', 'c1_m3')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold border border-slate-700 text-left transition-all"
                >
                  ⚔️ Màn 3: Điện Thái Hòa (c1_m3)
                </button>
                <button
                  onClick={() => handleWarp('LEVEL', 'c1_m4')}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold border border-slate-700 text-left transition-all"
                >
                  ⚔️ Màn 4: Lăng Tự Đức (c1_m4)
                </button>
                <button
                  onClick={() => handleWarp('BOSS')}
                  className="p-3 rounded-xl bg-rose-950/70 hover:bg-rose-600 font-bold border border-rose-800 text-rose-200 text-left transition-all"
                >
                  👹 Trùm Cuối: Bóng Lãng Quên (BOSS)
                </button>
                <button
                  onClick={() => handleWarp('RAP_AO')}
                  className="p-3 rounded-xl bg-teal-950/70 hover:bg-teal-600 font-bold border border-teal-800 text-teal-200 text-left transition-all"
                >
                  ✂️ Màn Ráp Áo Ngũ Thân (RAP_AO)
                </button>
                <button
                  onClick={() => handleWarp('REMIX')}
                  className="p-3 rounded-xl bg-amber-950/70 hover:bg-amber-600 font-bold border border-amber-800 text-amber-200 text-left transition-all"
                >
                  🎨 Phòng Thử Đồ Remix (REMIX)
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-slate-400">
                <span>Tiến trình hiện tại: {sceneMgr.unlockedStages.length} Màn đã mở</span>
                <button
                  onClick={() => {
                    sceneMgr.unlockedStages = ['c1_m1', 'c1_m2', 'c1_m3', 'c1_m4', 'c1_boss'];
                    sceneMgr.saveProgress();
                    alert('Đã mở khóa toàn bộ màn chơi Chương 1!');
                  }}
                  className="text-amber-400 hover:underline"
                >
                  [Mở khóa tất cả màn chơi]
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PALETTE 32 MÀU */}
          {activeSubTab === 'palette' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-amber-300">Bảng 32 Màu Cố Đô Chuẩn Pixel-Art:</h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PALETTE.map((c) => (
                  <div key={c.index} className="p-2 bg-slate-950 rounded border border-slate-800 text-center">
                    <div className="w-full h-8 rounded mb-1 border border-white/20" style={{ backgroundColor: c.hex }} />
                    <span className="text-[10px] font-mono block text-amber-300">{c.hex}</span>
                    <span className="text-[9px] text-slate-400 leading-tight block truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: THỬ /api/judge */}
          {activeSubTab === 'judge' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-300">Thẩm Định Bộ Phối Tự Do (POST /api/judge):</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">Bối cảnh:</label>
                  <select
                    value={testEvent}
                    onChange={(e) => setTestEvent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-amber-100"
                  >
                    <option value="di_tich_hue">Di tích Đại Nội Huế</option>
                    <option value="ky_yeu">Chụp ảnh kỷ yếu</option>
                    <option value="le_hoi">Lễ hội Festival Huế</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">Áo:</label>
                  <select
                    value={testAo}
                    onChange={(e) => setTestAo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-amber-100"
                  >
                    <option value="ao_ngu_than">Áo Ngũ Thân</option>
                    <option value="ao_dai_truyen_thong">Áo Dài Truyền Thống</option>
                    <option value="ao_hai_day">Áo Hai Dây (Test lỗi)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">Quần/Váy:</label>
                  <select
                    value={testQuan}
                    onChange={(e) => setTestQuan(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-amber-100"
                  >
                    <option value="quan_lua_ong_rong">Quần lụa ống rộng</option>
                    <option value="quan_short">Quần short ngắn</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRunJudgeTest}
                disabled={evaluating}
                className="px-5 py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all"
              >
                {evaluating ? 'Đang thẩm định...' : 'Gửi Thẩm Định (POST /api/judge)'}
              </button>

              {judgeResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        judgeResult.den === 'xanh'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : judgeResult.den === 'vang'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      ĐÈN {judgeResult.den}
                    </span>
                    <span className="text-slate-300">
                      Hòa hợp: <strong>{judgeResult.diem_hoa_hop}/100</strong> • Tôn trọng: <strong>{judgeResult.diem_ton_trong}/100</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
