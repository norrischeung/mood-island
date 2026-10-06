'use client';

import React, { useRef, useEffect, useState } from 'react';

type SeedType = 'blue' | 'yellow' | 'gray' | 'pink' | null;

interface SeedInfo {
  type: SeedType;
  name: string;
  color: string;
  location: string;
}

const SEED_DATA: Record<NonNullable<SeedType>, SeedInfo> = {
  blue: { type: 'blue', name: '靜謐藍種子', color: '#829AB1', location: '🌊 靜靜湖畔' },
  yellow: { type: 'yellow', name: '溫柔暖杏種子', color: '#D9B99B', location: '☀️ 微光山丘' },
  gray: { type: 'gray', name: '煙燻灰綠種子', color: '#8A9A86', location: '🌲 古樹樹蔭' },
  pink: { type: 'pink', name: '乾酪薔薇種子', color: '#C89D9C', location: '🌸 秘密花園' },
};

export default function MoodIsland() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentSeed, setCurrentSeed] = useState<SeedInfo | null>(null);
  const [notification, setNotification] = useState<string>('');

  // 玩家 3D 網格座標 (Grid X, Grid Y)
  const playerRef = useRef({
    gx: 8,
    gy: 8,
    dir: 'down' as 'up' | 'down' | 'left' | 'right',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // 莫蘭迪立體色板 (Top 頂面 / Left 左側暗面 / Right 右側亮面)
    const MORANDI = {
      sky: '#C5BDDB', // 天空背景

      // Grass (草地)
      grassTop: '#A3B18A',
      grassLeft: '#588157',
      grassRight: '#689067',

      // Water (湖泊 - 低凹處)
      waterTop: '#829AB1',
      waterLeft: '#486581',
      waterRight: '#627D98',

      // Mountain / Hill (山丘 - 抬升高度)
      hillTop: '#D9B99B',
      hillLeft: '#B08E70',
      hillRight: '#C49F7F',

      // Forest (樹蔭)
      treeTop: '#6B7A6E',
      treeLeft: '#435146',
      treeRight: '#546357',

      // Garden (花園)
      flowerTop: '#C89D9C',
      flowerLeft: '#A37978',
      flowerRight: '#B58B8A',

      player: '#E0A96D',
    };

    // 3D Isometric 網格參數
    const tileW = 24;  // 菱形寬度
    const tileH = 12;  // 菱形高度
    const gridSize = 18; // 18x18 網格

    const width = 480;
    const height = 270;
    canvas.width = width;
    canvas.height = height;

    // 平面 3D 轉換公式 (Isometric Projection)
    const toIso = (gx: number, gy: number, gz: number = 0) => {
      const screenX = width / 2 + (gx - gy) * (tileW / 2);
      const screenY = 80 + (gx + gy) * (tileH / 2) - gz;
      return { x: screenX, y: screenY };
    };

    // 繪製單個 3D Isometric 立體地塊 (含高度)
    const drawIsoBlock = (gx: number, gy: number, heightZ: number, colors: { top: string; left: string; right: string }) => {
      const pos = toIso(gx, gy, heightZ);
      const hw = tileW / 2;
      const hh = tileH / 2;
      const blockH = 8 + heightZ * 0.5; // 厚度

      // 1. 左側面 (Shadow Side)
      ctx.fillStyle = colors.left;
      ctx.beginPath();
      ctx.moveTo(pos.x - hw, pos.y);
      ctx.lineTo(pos.x, pos.y + hh);
      ctx.lineTo(pos.x, pos.y + hh + blockH);
      ctx.lineTo(pos.x - hw, pos.y + blockH);
      ctx.closePath();
      ctx.fill();

      // 2. 右側面 (Light Side)
      ctx.fillStyle = colors.right;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y + hh);
      ctx.lineTo(pos.x + hw, pos.y);
      ctx.lineTo(pos.x + hw, pos.y + blockH);
      ctx.lineTo(pos.x, pos.y + hh + blockH);
      ctx.closePath();
      ctx.fill();

      // 3. 頂面 (Top Face)
      ctx.fillStyle = colors.top;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - hh);
      ctx.lineTo(pos.x + hw, pos.y);
      ctx.lineTo(pos.x, pos.y + hh);
      ctx.lineTo(pos.x - hw, pos.y);
      ctx.closePath();
      ctx.fill();
    };

    // 繪製 3D 像素小人
    const drawPlayerIso = (gx: number, gy: number, dir: string) => {
      // 獲取玩家所在區域的高度
      let gz = 0;
      if (gx >= 12 && gy < 6) gz = 12; // 山丘高度
      if (gx < 6 && gy < 6) gz = -4;  // 湖泊凹陷

      const pos = toIso(gx, gy, gz);
      const px = pos.x;
      const py = pos.y - 4;

      // 腳下影子
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(px, py + 2, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 身體 (3D 莫蘭迪橙)
      ctx.fillStyle = MORANDI.player;
      ctx.fillRect(px - 3, py - 12, 6, 8);

      // 頭部
      ctx.fillStyle = '#F4E0C5';
      ctx.fillRect(px - 3, py - 18, 6, 6);

      // 頭髮/背影
      ctx.fillStyle = '#4A3E3D';
      if (dir === 'up') {
        ctx.fillRect(px - 3, py - 19, 6, 5); // 向上背影
      } else {
        ctx.fillRect(px - 3, py - 19, 6, 3);
        ctx.fillStyle = '#2B2B2B';
        ctx.fillRect(px - 2, py - 15, 1, 1);
        ctx.fillRect(px + 1, py - 15, 1, 1);
      }
    };

    let animationFrameId: number;

    const render = () => {
      // 全天空背景
      ctx.fillStyle = MORANDI.sky;
      ctx.fillRect(0, 0, width, height);

      // 依深度順序繪製 3D Isometric 網格 (Far to Near Rendering)
      for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
          let colors = { top: MORANDI.grassTop, left: MORANDI.grassLeft, right: MORANDI.grassRight };
          let gz = 0;

          // 🌊 湖畔 (左上角：向下凹陷 -4px)
          if (gx < 6 && gy < 6) {
            colors = { top: MORANDI.waterTop, left: MORANDI.waterLeft, right: MORANDI.waterRight };
            gz = -4;
          }
          // ☀️ 山丘 (右上角：向上隆起 +12px 3D 階梯感)
          else if (gx >= 12 && gy < 6) {
            colors = { top: MORANDI.hillTop, left: MORANDI.hillLeft, right: MORANDI.hillRight };
            gz = 12;
          }
          // 🌲 樹蔭 (左下角)
          else if (gx < 6 && gy >= 12) {
            colors = { top: MORANDI.treeTop, left: MORANDI.treeLeft, right: MORANDI.treeRight };
            gz = 2;
          }
          // 🌸 花園 (右下角)
          else if (gx >= 12 && gy >= 12) {
            colors = { top: MORANDI.flowerTop, left: MORANDI.flowerLeft, right: MORANDI.flowerRight };
            gz = 0;
          }

          drawIsoBlock(gx, gy, gz, colors);

          // 當繪製到玩家當前網格時，繪製玩家 (確保 Z-Index 遮擋正確)
          if (gx === Math.floor(playerRef.current.gx) && gy === Math.floor(playerRef.current.gy)) {
            drawPlayerIso(playerRef.current.gx, playerRef.current.gy, playerRef.current.dir);
          }
        }
      }

      // 靜態地圖標記
      ctx.font = '8px monospace';
      ctx.fillStyle = '#486581';
      ctx.fillText('🌊 靜靜湖畔', 60, 80);
      ctx.fillStyle = '#8C6D53';
      ctx.fillText('☀️ 微光高山', 360, 50);
      ctx.fillStyle = '#3E4C41';
      ctx.fillText('🌲 古樹樹蔭', 60, 200);
      ctx.fillStyle = '#8C5A59';
      ctx.fillText('🌸 秘密花園', 360, 200);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 鍵盤移動操控 (網格 Isometric 方向)
    const handleKeyDown = (e: KeyboardEvent) => {
      const p = playerRef.current;

      if (e.key === 'ArrowUp' || e.key === 'w') {
        p.gy = Math.max(0, p.gy - 1);
        p.gx = Math.max(0, p.gx - 1);
        p.dir = 'up';
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        p.gy = Math.min(gridSize - 1, p.gy + 1);
        p.gx = Math.min(gridSize - 1, p.gx + 1);
        p.dir = 'down';
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        p.gx = Math.max(0, p.gx - 1);
        p.dir = 'left';
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        p.gx = Math.min(gridSize - 1, p.gx + 1);
        p.dir = 'right';
      }

      checkAreaSeed(p.gx, p.gy);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const checkAreaSeed = (gx: number, gy: number) => {
    let pickedSeed: SeedType = null;

    if (gx < 6 && gy < 6) pickedSeed = 'blue';
    else if (gx >= 12 && gy < 6) pickedSeed = 'yellow';
    else if (gx < 6 && gy >= 12) pickedSeed = 'gray';
    else if (gx >= 12 && gy >= 12) pickedSeed = 'pink';

    if (pickedSeed) {
      const seed = SEED_DATA[pickedSeed];
      setCurrentSeed(seed);
      setNotification(`你走到了 ${seed.location}，採集到了【${seed.name}】`);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#C5BDDB] font-mono select-none flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover image-rendering-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* 頂部操作提示 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#F0EAE1]/80 backdrop-blur-md px-6 py-2 rounded-full border border-[#BCC1AC]/50 text-[#556358] text-xs sm:text-sm shadow-sm flex items-center gap-3">
        <span className="font-bold">🏝️ 3D Isometric 心情小島</span>
        <span className="text-[#BCC1AC]">|</span>
        <span className="text-[#627D98]">按 W/A/S/D 或方向鍵在 3D 網格漫步</span>
      </div>

      {/* 底部 HUD 狀態 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md">
        {notification ? (
          <div className="bg-[#F0EAE1]/90 backdrop-blur-md border border-[#BCC1AC] text-[#486581] p-3 rounded-2xl shadow-sm text-center text-xs sm:text-sm flex flex-col items-center gap-2">
            <div>{notification}</div>
            {currentSeed && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#8A9A86]">獲得的種子：</span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-white text-xs font-medium shadow-sm"
                  style={{ backgroundColor: currentSeed.color }}
                >
                  {currentSeed.name}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#F0EAE1]/60 backdrop-blur-md border border-[#BCC1AC]/40 text-[#8A9A86] p-3 rounded-2xl text-center text-xs">
            👉 按方向鍵試試看登頂右上角的【3D 微光高山】！
          </div>
        )}
      </div>
    </div>
  );
}