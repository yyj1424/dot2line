'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot, Sparkles, Truck, Box, Navigation, ShieldCheck,
  AlertTriangle, ArrowRight, RefreshCw, Eye, Play, Pause,
  RotateCw, ZoomIn, ZoomOut, CheckCircle2, ChevronRight,
  Layers, MapPin, Gauge, Activity, Radio, Cpu, Send,
  Sliders, ArrowUpRight, Warehouse, Route, Check, Zap,
  ShoppingCart, BarChart2, ShieldAlert, CheckCheck
} from 'lucide-react';

/* =========================================================================
   1. 3D 디지털 트윈 화물 적재 시뮬레이터 (트럭 3D & 창고 랙 3D 듀얼 모드)
   ========================================================================= */

interface CargoBox {
  id: string;
  name: string;
  consignee: string;
  stop: number;
  color: string;
  x: number; // mm
  y: number; // mm (height)
  z: number; // mm (length/depth)
  w: number; // mm
  h: number; // mm
  d: number; // mm
  weightKg: number;
  fragile?: boolean;
}

const TRUCK_DIMENSIONS = {
  length: 6200, // mm (Z)
  width: 2300,  // mm (X)
  height: 2400, // mm (Y)
};

const SAMPLE_CARGO: CargoBox[] = [
  // 5번 정류장 화물 (가장 안쪽 적재)
  { id: 'BX-001', name: '원목 식탁 상판 (오크)', consignee: '최*희 (용인 기흥)', stop: 5, color: '#6366f1', x: 200, y: 0, z: 200, w: 900, h: 400, d: 1800, weightKg: 35.0, fragile: true },
  { id: 'BX-002', name: '원목 체어 A세트 (2개입)', consignee: '최*희 (용인 기흥)', stop: 5, color: '#818cf8', x: 1200, y: 0, z: 200, w: 900, h: 800, d: 800, weightKg: 18.0 },
  { id: 'BX-003', name: '원목 체어 B세트 (2개입)', consignee: '최*희 (용인 기흥)', stop: 5, color: '#818cf8', x: 1200, y: 0, z: 1100, w: 900, h: 800, d: 800, weightKg: 18.0 },

  // 4번 정류장 화물
  { id: 'BX-004', name: '1인용 패브릭 리클라이너', consignee: '정*우 (수원 영통)', stop: 4, color: '#06b6d4', x: 200, y: 0, z: 2100, w: 1000, h: 1100, d: 1100, weightKg: 42.0 },
  { id: 'BX-005', name: '스탠드 조명 패키지', consignee: '정*우 (수원 영통)', stop: 4, color: '#22d3ee', x: 1300, y: 0, z: 2100, w: 800, h: 1200, d: 800, weightKg: 15.0, fragile: true },

  // 3번 정류장 화물
  { id: 'BX-006', name: '화이트 3단 서랍장', consignee: '김*수 (성남 분당)', stop: 3, color: '#10b981', x: 200, y: 0, z: 3300, w: 900, h: 900, d: 1200, weightKg: 28.0 },
  { id: 'BX-007', name: '베드사이드 협탁 2종', consignee: '김*수 (성남 분당)', stop: 3, color: '#34d399', x: 1200, y: 0, z: 3300, w: 900, h: 700, d: 900, weightKg: 16.0 },

  // 2번 정류장 화물
  { id: 'BX-008', name: '인체공학 메쉬 체어', consignee: '이*진 (서울 서초)', stop: 2, color: '#f59e0b', x: 200, y: 0, z: 4600, w: 800, h: 950, d: 800, weightKg: 14.5 },
  { id: 'BX-009', name: '모션데스크 전동 프레임', consignee: '이*진 (서울 서초)', stop: 2, color: '#fbbf24', x: 1100, y: 0, z: 4300, w: 1000, h: 400, d: 1500, weightKg: 32.0 },

  // 1번 정류장 화물 (가장 앞문 도어 쪽 적재 - 첫 번째 배송)
  { id: 'BX-010', name: '대형 에어 서큘레이터', consignee: '박*훈 (서울 강남)', stop: 1, color: '#ec4899', x: 300, y: 0, z: 5450, w: 600, h: 600, d: 650, weightKg: 8.5 },
  { id: 'BX-011', name: '듀얼 모니터암 프리미엄', consignee: '박*훈 (서울 강남)', stop: 1, color: '#f472b6', x: 1000, y: 0, z: 5450, w: 500, h: 400, d: 600, weightKg: 6.0 },
];

function Truck3DCubingViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'TRUCK' | 'RACK'>('TRUCK');
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(45);
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [currentStep, setCurrentStep] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [selectedBox, setSelectedBox] = useState<CargoBox | null>(SAMPLE_CARGO[0]);

  // 마우스 드래그 3D 회전 제어
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setRotY((prev) => (prev + dx * 0.5) % 360);
    setRotX((prev) => Math.max(-60, Math.min(80, prev - dy * 0.5)));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // 스텝별 자동 상차 재생 루프 (Auto-Play)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 1800);
    return () => clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;
    const cosX = Math.cos(radX), sinX = Math.sin(radX);
    const cosY = Math.cos(radY), sinY = Math.sin(radY);

    const scale = (Math.min(width, height) / 8000) * zoom;
    const cx = width / 2;
    const cy = height / 2 + 55;

    // 3D ➔ 2D 등각 투영 변환
    const project = (x: number, y: number, z: number) => {
      const ox = x - TRUCK_DIMENSIONS.width / 2;
      const oy = y - TRUCK_DIMENSIONS.height / 2;
      const oz = z - TRUCK_DIMENSIONS.length / 2;

      const x1 = ox * cosY + oz * sinY;
      const z1 = -ox * sinY + oz * cosY;

      const y2 = oy * cosX - z1 * sinX;
      const z2 = oy * sinX + z1 * cosX;

      return {
        px: cx + x1 * scale,
        py: cy - y2 * scale,
        depth: z2,
      };
    };

    if (viewMode === 'TRUCK') {
      // 바닥 격자 그리드
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;
      for (let z = 0; z <= TRUCK_DIMENSIONS.length; z += 1000) {
        const p1 = project(0, 0, z);
        const p2 = project(TRUCK_DIMENSIONS.width, 0, z);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
      for (let x = 0; x <= TRUCK_DIMENSIONS.width; x += 1000) {
        const p1 = project(x, 0, 0);
        const p2 = project(x, 0, TRUCK_DIMENSIONS.length);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }

      // 트럭 컨테이너 외곽 섀시 프레임
      const corners = [
        project(0, 0, 0),
        project(TRUCK_DIMENSIONS.width, 0, 0),
        project(TRUCK_DIMENSIONS.width, TRUCK_DIMENSIONS.height, 0),
        project(0, TRUCK_DIMENSIONS.height, 0),
        project(0, 0, TRUCK_DIMENSIONS.length),
        project(TRUCK_DIMENSIONS.width, 0, TRUCK_DIMENSIONS.length),
        project(TRUCK_DIMENSIONS.width, TRUCK_DIMENSIONS.height, TRUCK_DIMENSIONS.length),
        project(0, TRUCK_DIMENSIONS.height, TRUCK_DIMENSIONS.length),
      ];

      ctx.strokeStyle = xrayMode ? 'rgba(56, 189, 248, 0.6)' : 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = xrayMode ? 2 : 1.2;
      ctx.setLineDash(xrayMode ? [2, 2] : [4, 4]);

      const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7]
      ];
      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(corners[i].px, corners[i].py);
        ctx.lineTo(corners[j].px, corners[j].py);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 화물 박스 렌더링
      const visibleBoxes = SAMPLE_CARGO.filter((b) => b.stop >= 6 - currentStep);

      const sortedBoxes = visibleBoxes.map((b) => {
        const center = project(b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2);
        return { box: b, depth: center.depth };
      }).sort((a, b) => a.depth - b.depth);

      sortedBoxes.forEach(({ box }) => {
        const isSelected = selectedBox?.id === box.id;
        const x0 = box.x, x1 = box.x + box.w;
        const y0 = box.y, y1 = box.y + box.h;
        const z0 = box.z, z1 = box.z + box.d;

        const p0 = project(x0, y0, z0);
        const p1 = project(x1, y0, z0);
        const p2 = project(x1, y1, z0);
        const p3 = project(x0, y1, z0);
        const p4 = project(x0, y0, z1);
        const p5 = project(x1, y0, z1);
        const p6 = project(x1, y1, z1);
        const p7 = project(x0, y1, z1);

        // 상단면
        ctx.fillStyle = isSelected ? '#fbbf24' : box.color;
        ctx.beginPath();
        ctx.moveTo(p3.px, p3.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.lineTo(p6.px, p6.py);
        ctx.lineTo(p7.px, p7.py);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)';
        ctx.lineWidth = isSelected ? 2 : 0.8;
        ctx.stroke();

        // 전면
        ctx.fillStyle = adjustBrightness(box.color, isSelected ? -5 : -20);
        ctx.beginPath();
        ctx.moveTo(p4.px, p4.py);
        ctx.lineTo(p5.px, p5.py);
        ctx.lineTo(p6.px, p6.py);
        ctx.lineTo(p7.px, p7.py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 우측면
        ctx.fillStyle = adjustBrightness(box.color, isSelected ? -20 : -35);
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p5.px, p5.py);
        ctx.lineTo(p6.px, p6.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

    } else {
      // WMS 3D 랙 웨어하우스 모드 렌더링
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;

      // 3개 통로, 4단 랙 골든존 시각화
      for (let aisle = 0; aisle < 3; aisle++) {
        const xOffset = aisle * 1600 + 400;
        for (let bay = 0; bay < 4; bay++) {
          const zOffset = bay * 1400 + 400;
          for (let level = 0; level < 4; level++) {
            const yOffset = level * 550;
            const isGoldenZone = level === 1 || level === 2; // 골든존 (허리~가슴 높이)

            const p0 = project(xOffset, yOffset, zOffset);
            const p1 = project(xOffset + 1200, yOffset, zOffset);
            const p2 = project(xOffset + 1200, yOffset + 500, zOffset);
            const p3 = project(xOffset, yOffset + 500, zOffset);
            const p6 = project(xOffset + 1200, yOffset + 500, zOffset + 1000);
            const p7 = project(xOffset, yOffset + 500, zOffset + 1000);

            ctx.fillStyle = isGoldenZone
              ? (aisle === 1 ? '#10b981' : '#34d399')
              : '#334155';

            ctx.beginPath();
            ctx.moveTo(p3.px, p3.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.lineTo(p6.px, p6.py);
            ctx.lineTo(p7.px, p7.py);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = isGoldenZone ? '#a7f3d0' : '#64748b';
            ctx.lineWidth = isGoldenZone ? 1.5 : 0.6;
            ctx.stroke();
          }
        }
      }
    }
  }, [rotX, rotY, zoom, currentStep, viewMode, xrayMode, selectedBox]);

  function adjustBrightness(hex: string, percent: number) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  const loadedVolumeCbm = (
    SAMPLE_CARGO.filter((b) => b.stop >= 6 - currentStep)
      .reduce((sum, b) => sum + (b.w * b.h * b.d) / 1e9, 0)
  ).toFixed(1);

  const totalCapacityCbm = ((TRUCK_DIMENSIONS.length * TRUCK_DIMENSIONS.width * TRUCK_DIMENSIONS.height) / 1e9).toFixed(1);
  const volumeEfficiency = Math.round((Number(loadedVolumeCbm) / Number(totalCapacityCbm)) * 100);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {viewMode === 'TRUCK' ? <Box size={18} /> : <Warehouse size={18} />}
            </span>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {viewMode === 'TRUCK' ? '3D 트럭 적재 시뮬레이터 (Cubing Engine)' : '3D 창고 랙 로케이션 & 골든존 (WMS Slotting)'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                Digital Twin
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {viewMode === 'TRUCK'
              ? 'LIFO(후입선출) 역순 배송지별 패킹 및 실시간 축중 밸런스 3D 시뮬레이션'
              : '파레토 ABC 30일 출고 빈도 기반 골든존(2~3단) 자동 배치 시각화'}
          </p>
        </div>

        {/* 듀얼 모드 및 3D 뷰어 제어 바 */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('TRUCK')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'TRUCK' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              5T 윙바디
            </button>
            <button
              onClick={() => setViewMode('RACK')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'RACK' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              WMS 랙
            </button>
          </div>

          <button
            onClick={() => setXrayMode((x) => !x)}
            className={`p-1.5 rounded-lg text-xs transition border ${
              xrayMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="X-Ray 투시 모드"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => { setRotX(25); setRotY(45); setZoom(0.85); }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700"
            title="기본 시점 복원"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* 3D Canvas 영역 */}
      <div
        className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-slate-950/90 to-slate-900/90 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="w-full h-full object-contain"
        />

        {/* 좌측 상단 HUD 지표 */}
        <div className="absolute top-3 left-3 space-y-1.5 pointer-events-none">
          <div className="px-2.5 py-1 bg-slate-900/85 border border-slate-700/60 rounded-lg backdrop-blur text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="text-slate-500">차량:</span>
            <strong className="text-white">5T 윙바디 (6.2m × 2.3m × 2.4m)</strong>
          </div>
          <div className="px-2.5 py-1 bg-slate-900/85 border border-slate-700/60 rounded-lg backdrop-blur text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="text-slate-500">적재 효율:</span>
            <strong className="text-emerald-400 font-bold">{volumeEfficiency}%</strong>
            <span className="text-[10px] text-slate-400">({loadedVolumeCbm} / {totalCapacityCbm} CBM)</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-900/85 border border-slate-700/60 rounded-lg backdrop-blur text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="text-slate-500">축중 분배:</span>
            <span className="text-indigo-300 font-mono">전축 42% / 후축 58% (최적 균형)</span>
          </div>
        </div>

        {/* 우측 상단 LIFO 순번 가이드 */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right mb-0.5">LIFO 하차 순번</span>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span className="text-[10px] text-slate-300">Stop 1 (강남)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-300">Stop 2 (서초)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-300">Stop 3 (분당)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span className="text-[10px] text-slate-300">Stop 4 (영통)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] text-slate-300">Stop 5 (기흥)</span>
          </div>
        </div>
      </div>

      {/* 단계별 상차 슬라이더 & 자동재생 버튼 */}
      <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1 text-[11px] font-semibold"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? '일시정지' : '상차 자동재생'}</span>
            </button>
            <span className="text-slate-300 font-semibold">
              적재 진행도: <strong className="text-indigo-400">Step {currentStep} / 5</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentStep === 5 ? '전체 적재 완료 (출발 준비)' : `잔여 ${5 - currentStep}개 배송지`}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={currentStep}
          onChange={(e) => setCurrentStep(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
      </div>

      {/* 선택 화물 상세 인스펙터 바 */}
      {selectedBox && (
        <div className="p-3 bg-slate-800/40 border border-indigo-500/20 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: selectedBox.color }} />
            <div>
              <span className="font-bold text-white">{selectedBox.name}</span>
              <span className="text-slate-400 text-[11px] ml-2">({selectedBox.consignee})</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
            <span>규격: {selectedBox.w}×{selectedBox.h}×{selectedBox.d}mm</span>
            <span className="text-emerald-400 font-bold">{selectedBox.weightKg}kg</span>
            <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[10px]">
              Stop #{selectedBox.stop}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. 인터랙티브 VRP 2-Opt 배송 경로 최적화 맵 (Interactive Route Map)
   ========================================================================= */

function VrpRouteMapViewer() {
  const [routeMode, setRouteMode] = useState<'AFTER_2OPT' | 'BEFORE'>('AFTER_2OPT');

  // 수도권 주요 거점 및 배송지 좌표 (SVG 뷰포트 정규화)
  const WAYPOINTS = [
    { id: 'HUB', name: '이천 통합물류센터 (출발)', x: 380, y: 240, type: 'HUB' },
    { id: 'S5', name: 'Stop 5: 용인 기흥구', x: 280, y: 220, type: 'STOP' },
    { id: 'S4', name: 'Stop 4: 수원 영통구', x: 230, y: 210, type: 'STOP' },
    { id: 'S3', name: 'Stop 3: 성남 분당구', x: 260, y: 150, type: 'STOP' },
    { id: 'S2', name: 'Stop 2: 서울 서초구', x: 210, y: 100, type: 'STOP' },
    { id: 'S1', name: 'Stop 1: 서울 강남구', x: 240, y: 80, type: 'STOP' },
  ];

  // 2-Opt 최적화 후: 매끄러운 단일 루프
  const OPTIMIZED_PATH = "M 380 240 L 280 220 L 230 210 L 260 150 L 210 100 L 240 80";

  // 최적화 전 (비효율적인 교차 지그재그 경로)
  const UNOPTIMIZED_PATH = "M 380 240 L 240 80 L 280 220 L 210 100 L 260 150 L 230 210";

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Route size={18} />
            </span>
            <h3 className="text-base font-bold text-white">
              VRP 2-Opt 휴리스틱 경로 최적화 관제 맵
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            이천 메인허브 출발 ➔ 수도권 5개 경유지 2-Opt TSP 알고리즘 교차선 제거 시뮬레이션
          </p>
        </div>

        {/* 최적화 전/후 비교 스위치 */}
        <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
          <button
            onClick={() => setRouteMode('AFTER_2OPT')}
            className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
              routeMode === 'AFTER_2OPT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>2-Opt 최적화 (51.8km)</span>
          </button>
          <button
            onClick={() => setRouteMode('BEFORE')}
            className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
              routeMode === 'BEFORE'
                ? 'bg-red-950/50 text-red-300 border border-red-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>최적화 전 (64.2km)</span>
          </button>
        </div>
      </div>

      {/* SVG 인터랙티브 루트 맵 */}
      <div className="relative w-full h-72 sm:h-80 bg-slate-950/90 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center">
        <svg viewBox="100 40 350 240" className="w-full h-full">
          {/* 배경 격자 라인 */}
          <line x1="100" y1="100" x2="450" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="100" y1="160" x2="450" y2="160" stroke="#1e293b" strokeDasharray="3 3" />
          <line x1="100" y1="220" x2="450" y2="220" stroke="#1e293b" strokeDasharray="3 3" />

          {/* 운행 경로 라인 */}
          <path
            d={routeMode === 'AFTER_2OPT' ? OPTIMIZED_PATH : UNOPTIMIZED_PATH}
            fill="none"
            stroke={routeMode === 'AFTER_2OPT' ? '#10b981' : '#ef4444'}
            strokeWidth="3.5"
            strokeDasharray={routeMode === 'AFTER_2OPT' ? 'none' : '4 4'}
            className="transition-all duration-700"
          />

          {/* 웨이포인트 노드 렌더링 */}
          {WAYPOINTS.map((wp) => (
            <g key={wp.id} className="cursor-pointer">
              <circle
                cx={wp.x}
                cy={wp.y}
                r={wp.type === 'HUB' ? 9 : 6.5}
                fill={wp.type === 'HUB' ? '#4f46e5' : '#06b6d4'}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={wp.x + 10}
                y={wp.y + 4}
                fill="#e2e8f0"
                fontSize="9"
                fontWeight="bold"
                className="select-none font-sans"
              >
                {wp.name}
              </text>
            </g>
          ))}
        </svg>

        {/* 맵 상단 플로팅 절감 성과 카드 */}
        <div className="absolute top-3 left-3 bg-slate-900/85 border border-slate-700/60 rounded-xl p-2.5 text-xs backdrop-blur space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">총 운행 거리:</span>
            <strong className={routeMode === 'AFTER_2OPT' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {routeMode === 'AFTER_2OPT' ? '51.8 km (-19.3% 단축)' : '64.2 km (비효율 경로)'}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">예상 소요시간:</span>
            <strong className="text-slate-200">
              {routeMode === 'AFTER_2OPT' ? '116분 (32분 절감)' : '148분'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. AI 스마트 물류 코파일럿 대화 엔진 (Full-Interactive Multi-Turn)
   ========================================================================= */

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  actionCard?: {
    title: string;
    metrics: { label: string; value: string }[];
    buttonText: string;
    onClickNotice: string;
  };
}

function AiLogisticsCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'bot',
      text: '반갑습니다. DOT2LINE 전사 AI 물류 코파일럿입니다. CAPA 부하 진단, 2-Opt 경로 최적화, BOM 부품 수불, 유가 연동 정산 등 실시간 질의를 지시해 주세요.',
      time: '08:20',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateBotResponse(userText);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const generateBotResponse = (prompt: string): ChatMessage => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const p = prompt.toLowerCase();

    if (p.includes('단가') || p.includes('운임') || p.includes('11t') || p.includes('수송')) {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: '11T 수송 차량(100km, 냉장 20%, 야간 20%, 주말 10%, 리프트 게이트) 표준 단가 매트릭스를 대사하였습니다.',
        time,
        actionCard: {
          title: '11T 냉장 차량 표준 계약 운임 산출',
          metrics: [
            { label: '기본 운임', value: '460,000원' },
            { label: '복합 할증액', value: '+250,000원' },
            { label: '총 공급가액', value: '710,000원' },
            { label: '부가세 포함 합계', value: '781,000원' },
          ],
          buttonText: '배차 전표 단가 바인딩',
          onClickNotice: '배차 전표(T_DISPATCH)에 781,000원 표준 단가가 바인딩되었습니다.',
        },
      };
    } else if (p.includes('bom') || p.includes('세트') || p.includes('부품') || p.includes('식탁')) {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: '4인 원목 식탁세트(BOM) 5건 출고 요청을 검증했습니다. 원목 체어 재고 부족으로 세트 부분 출고가 자동 차단되었습니다.',
        time,
        actionCard: {
          title: 'BOM 세트 수불 검증 (부품 부족)',
          metrics: [
            { label: '요청 수량', value: '5 세트' },
            { label: '체어 가용재고', value: '8개 (12개 부족)' },
            { label: '최대 조립가능', value: '2 세트' },
            { label: '판정 상태', value: 'LACK_OF_COMPONENT' },
          ],
          buttonText: '2세트 우선 분할 출고',
          onClickNotice: '2세트 우선 출고 분할 전표가 생성되었습니다.',
        },
      };
    } else if (p.includes('capa') || p.includes('부하') || p.includes('초과') || p.includes('강남')) {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: '강남/서초권역 당일 배송 부하율 140%(초과 12 CBM)가 감지되었습니다. 2.5T 중형 윙바디 긴급 증차를 제안합니다.',
        time,
        actionCard: {
          title: '권역 CAPA 초과 자동 대응안',
          metrics: [
            { label: '현재 부하율', value: '140.0% (심각)' },
            { label: '초과 용적', value: '+12.0 CBM' },
            { label: '추천 차량', value: '2.5T 윙바디 1대' },
          ],
          buttonText: '증차 배차 승인',
          onClickNotice: '2.5T 윙바디 긴급 증차가 승인되어 배차가 생성되었습니다.',
        },
      };
    } else if (p.includes('실사') || p.includes('순환') || p.includes('오차') || p.includes('재고실사')) {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: '이천센터 A급 순환재고실사를 대사했습니다. 50개 로케이션 중 48개 완료(오차 2건: 상판 +2 과다, 체어 -2 부족)가 검출되었습니다.',
        time,
        actionCard: {
          title: '[WMS-05] 순환재고실사 차이 분석 및 원장 보정',
          metrics: [
            { label: '실사 완료율', value: '48/50 (96%)' },
            { label: '전산 불일치', value: '2건 (오차율 4.2%)' },
            { label: '차이 내역', value: '+2 과다 / -2 부족' },
            { label: '원장 보정', value: '승인 대기중' },
          ],
          buttonText: '실사 차이 재고원장 자동 보정',
          onClickNotice: 'T_WMS_STOCK_LEDGER 원장 수량이 실사값으로 일치화되었으며 실사 계획이 APPROVED 되었습니다.',
        },
      };
    } else if (p.includes('쇼핑몰') || p.includes('채널') || p.includes('스마트스토어') || p.includes('쿠팡')) {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: '네이버 스마트스토어, 쿠팡 윙, 11번가 채널 주문 94건을 수집하고, 출고 완료 송장 3건을 실시간 역전송 대기열에 바인딩했습니다.',
        time,
        actionCard: {
          title: '[OMS-CH] 다채널 주문 자동 수집 및 송장 역전송',
          metrics: [
            { label: '연동 채널', value: '네이버, 쿠팡, 11st' },
            { label: '신규 수집 주문', value: '94건 (중복 0건)' },
            { label: 'OMS 자동 변환', value: '100% 즉시 등록' },
            { label: '송장 역전송', value: '3건 전송 대기' },
          ],
          buttonText: '미전송 송장 즉시 역전송 실행',
          onClickNotice: '쿠팡/네이버 스마트스토어로 3건의 출고 송장번호가 성공적으로 역전송되었습니다.',
        },
      };
    } else if (p.includes('배차') || p.includes('푸시') || p.includes('fcm') || p.includes('기사')) {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: '12가 3456(김민수 기사) 차량에 2-Opt 최적 경로를 바인딩하고 FCM 긴급 배차 알림(15분 타임아웃 타이머 가동)을 전송했습니다.',
        time,
        actionCard: {
          title: '[TMS-02] 모바일 기사 배차 FCM 푸시 & 타임아웃 관제',
          metrics: [
            { label: '배차 대상', value: '12가 3456 (김민수)' },
            { label: 'FCM 우선순위', value: 'HIGH_PRIORITY' },
            { label: '응답 카운트다운', value: '15분 제한' },
            { label: '타임아웃 감지', value: '15분 미응답 시 자동 경보' },
          ],
          buttonText: '기사 앱 배차 푸시 재전송',
          onClickNotice: '김민수 기사님 단말기로 최적 배송 경로 푸시가 재전송되었습니다.',
        },
      };
    } else if (p.includes('송장') || p.includes('택배') || p.includes('cj') || p.includes('우체국')) {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: 'CJ대한통운(Mod-7) 12자리 유효 운송장 689201234562 번을 검증하였습니다. 정상 등록 번호입니다.',
        time,
        actionCard: {
          title: '국내 택배사 운송장 체크섬 검증 통과',
          metrics: [
            { label: '택배사', value: 'CJ대한통운' },
            { label: '운송장번호', value: '6892-0123-4562' },
            { label: '체크섬 결과', value: 'Mod-7 유효 (PASS)' },
          ],
          buttonText: '실시간 배송 조회',
          onClickNotice: '공식 배송조회 페이지로 연결되었습니다.',
        },
      };
    } else {
      return {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: `"${prompt}" 에 대한 OMS/TMS 복합 규칙을 분석했습니다. 모든 거점의 가용재고 및 14:00 주문 마감 컷오프가 충족되어 정상 자동 처리 대기열에 등록되었습니다.`,
        time,
      };
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md flex flex-col h-[520px]">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              DOT2LINE AI 코파일럿
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold animate-pulse">
                Live AI
              </span>
            </h3>
            <p className="text-xs text-slate-400">자연어 지시 및 실시간 다차원 제약 최적화</p>
          </div>
        </div>
      </div>

      {/* 대화 히스토리 스크롤 뷰 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3 rounded-2xl leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-none shadow-md'
              }`}
            >
              {m.text}

              {/* 봇 액션 카드 */}
              {m.actionCard && (
                <div className="mt-3 p-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2">
                  <span className="font-bold text-indigo-300 block text-[11px] pb-1 border-b border-slate-800">
                    {m.actionCard.title}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {m.actionCard.metrics.map((met, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400 block">{met.label}</span>
                        <strong className="text-emerald-400">{met.value}</strong>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => alert(m.actionCard?.onClickNotice)}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-[11px] transition active:scale-95 flex items-center justify-center gap-1"
                  >
                    <span>{m.actionCard.buttonText}</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">{m.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 p-2 font-medium animate-pulse">
            <Sparkles size={13} />
            <span>AI 코파일럿이 플랫폼 원장을 대사하고 있습니다...</span>
          </div>
        )}
      </div>

      {/* 빠른 지시 칩 바 */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
        <button
          onClick={() => handleSend('A급 순환재고실사 대사해줘')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition"
        >
          📋 A급 순환재고실사
        </button>
        <button
          onClick={() => handleSend('쇼핑몰 신규주문 수집해줘')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition"
        >
          🛒 쇼핑몰 주문수집
        </button>
        <button
          onClick={() => handleSend('기사 모바일 배차 푸시 전송해줘')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition"
        >
          📲 기사 배차 푸시
        </button>
        <button
          onClick={() => handleSend('강남권역 CAPA 140% 초과 대책 수립해줘')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition"
        >
          🚨 CAPA 140% 초과
        </button>
        <button
          onClick={() => handleSend('식탁세트 BOM 부품 부족 검증해줘')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition"
        >
          📦 BOM 식탁세트 검증
        </button>
        <button
          onClick={() => handleSend('11T 냉장 100km 수송 단가 계산해줘')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition"
        >
          🚚 11T 수송 단가
        </button>
        <button
          onClick={() => handleSend('CJ 택배 운송장 체크섬 확인해줘')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap border border-slate-700 transition"
        >
          🏷️ CJ 송장 체크섬
        </button>
      </div>

      {/* 자연어 질의 입력창 */}
      <div className="flex items-center gap-2 pt-1 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AI 코파일럿에게 물류 운영 지시를 입력하세요 (Enter)"
          className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(input);
          }}
        />
        <button
          onClick={() => handleSend(input)}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   4. 다채널 쇼핑몰 연동 허브 (Channel Order Gateway)
   ========================================================================= */

interface ChannelInfo {
  id: string;
  name: string;
  badgeColor: string;
  orderCountToday: number;
  status: 'ACTIVE' | 'SYNCING';
  lastSyncTime: string;
  pendingInvoices: number;
}

function ChannelSyncHub() {
  const [channels, setChannels] = useState<ChannelInfo[]>([
    { id: 'NAVER', name: '네이버 스마트스토어', badgeColor: '#03C75A', orderCountToday: 34, status: 'ACTIVE', lastSyncTime: '09:25:10', pendingInvoices: 1 },
    { id: 'COUPANG', name: '쿠팡 윙 (로켓그로스)', badgeColor: '#E01E26', orderCountToday: 48, status: 'ACTIVE', lastSyncTime: '09:24:45', pendingInvoices: 2 },
    { id: '11ST', name: '11번가 오픈마켓', badgeColor: '#FF143C', orderCountToday: 12, status: 'ACTIVE', lastSyncTime: '09:20:12', pendingInvoices: 0 },
    { id: 'KAKAO', name: '카카오 선물하기', badgeColor: '#FEE500', orderCountToday: 18, status: 'ACTIVE', lastSyncTime: '09:22:30', pendingInvoices: 0 },
  ]);

  const [syncing, setSyncing] = useState(false);
  const [liveStreamOrders, setLiveStreamOrders] = useState([
    { channel: '네이버', orderNo: 'NV-20261007-0094', product: '원목 4인 다이닝 세트', time: '방금 전', amount: '480,000원' },
    { channel: '쿠팡', orderNo: 'CP-20261007-0182', product: '인체공학 메시 사무용 체어 2개', time: '1분 전', amount: '220,000원' },
    { channel: '11번가', orderNo: '11-20261007-0031', product: '스마트 높낮이 전동 데스크', time: '3분 전', amount: '350,000원' },
  ]);

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      const nowStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setChannels(prev => prev.map(c => ({
        ...c,
        orderCountToday: c.orderCountToday + Math.floor(Math.random() * 3 + 1),
        lastSyncTime: nowStr
      })));
      setLiveStreamOrders(prev => [
        { channel: '네이버', orderNo: `NV-${Date.now().toString().slice(-8)}`, product: '원목 체어 A세트 (추가수집)', time: '방금 전', amount: '120,000원' },
        ...prev.slice(0, 3)
      ]);
    }, 900);
  };

  const handleSendInvoices = () => {
    alert('모든 출고 완료 건(3건)의 송장번호가 쿠팡/네이버 API로 역전송 완료되었습니다.');
    setChannels(prev => prev.map(c => ({ ...c, pendingInvoices: 0 })));
  };

  const totalOrders = channels.reduce((acc, c) => acc + c.orderCountToday, 0);
  const totalPendingInvoices = channels.reduce((acc, c) => acc + c.pendingInvoices, 0);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShoppingCart size={18} />
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              쇼핑몰 다채널 실시간 수집 허브
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                OAuth 2.0 연동
              </span>
            </h3>
            <p className="text-xs text-slate-400">네이버·쿠팡·11번가 신규 결제 주문 자동 수집 및 송장 역전송</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {totalPendingInvoices > 0 && (
            <button
              onClick={handleSendInvoices}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1"
            >
              <CheckCheck size={13} />
              <span>송장 역전송 ({totalPendingInvoices}건 대기)</span>
            </button>
          )}
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1 shadow-md shadow-indigo-600/20"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? '수집중...' : '즉시 수집 (Sync Now)'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {channels.map(c => (
          <div key={c.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-white truncate">{c.name}</span>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.badgeColor }} />
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-[10px] text-slate-500">당일 수집</span>
              <strong className="text-sm font-bold text-emerald-400 font-mono">{c.orderCountToday} 건</strong>
            </div>
            <p className="text-[9px] text-slate-500 truncate pt-0.5 border-t border-slate-900">
              최근수집: {c.lastSyncTime}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <Activity size={12} className="text-cyan-400" /> 실시간 수집 전표 스트림
          </span>
          <span className="text-[10px] text-slate-500 font-mono">총 {totalOrders}건 수집 완료 (대사율 100%)</span>
        </div>
        <div className="space-y-1.5">
          {liveStreamOrders.map((ord, idx) => (
            <div key={idx} className="flex justify-between items-center text-[11px] p-2 bg-slate-900/60 rounded-lg border border-slate-800/60 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {ord.channel}
                </span>
                <span className="font-mono text-indigo-200">{ord.orderNo}</span>
                <span className="text-slate-400 max-w-[160px] truncate">{ord.product}</span>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-emerald-400 font-mono">{ord.amount}</strong>
                <span className="text-[10px] text-slate-500">{ord.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. WMS 순환 재고실사 디지털 관제 (Cycle Counting & Discrepancy Heatmap)
   ========================================================================= */

interface DiscrepancyItem {
  id: string;
  locCd: string;
  productNm: string;
  productCd: string;
  systemQty: number;
  countedQty: number;
  diffQty: number;
  diffType: 'SURPLUS' | 'SHORTAGE' | 'MATCH';
  status: 'PENDING' | 'ADJUSTED';
}

function WmsCycleCountWidget() {
  const [planStatus, setPlanStatus] = useState<'IN_PROGRESS' | 'APPROVED'>('IN_PROGRESS');
  const [items, setItems] = useState<DiscrepancyItem[]>([
    { id: '1', locCd: 'A-01-01', productNm: '원목 식탁 상판 (오크)', productCd: 'PROD-OAK-01', systemQty: 10, countedQty: 12, diffQty: 2, diffType: 'SURPLUS', status: 'PENDING' },
    { id: '2', locCd: 'A-01-02', productNm: '원목 체어 A세트', productCd: 'PROD-CHAIR-01', systemQty: 20, countedQty: 18, diffQty: -2, diffType: 'SHORTAGE', status: 'PENDING' },
  ]);

  const handleApproveAdjust = () => {
    setItems(prev => prev.map(it => ({ ...it, status: 'ADJUSTED' })));
    setPlanStatus('APPROVED');
    alert('[WMS-05] 순환실사 차이 승인 완료: T_WMS_STOCK_LEDGER 원장 수량이 실사 수량으로 즉시 보정되었습니다.');
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart2 size={18} />
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              WMS 순환 재고실사 (Cycle Count)
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                planStatus === 'APPROVED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
              }`}>
                {planStatus === 'APPROVED' ? '보정 완료 (APPROVED)' : '실사 대사중 (IN_PROGRESS)'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">ABC 등급별 고회전 SKU 일일 실사 및 전산 재고 원장 자동 일치화</p>
          </div>
        </div>

        {planStatus === 'IN_PROGRESS' && (
          <button
            onClick={handleApproveAdjust}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-md shadow-emerald-600/20"
          >
            <ShieldAlert size={13} />
            <span>차이 원장 보정 승인</span>
          </button>
        )}
      </div>

      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">[IC01] A급 품목 일일 실사 진행률</span>
          <strong className="text-indigo-300 font-mono">48 / 50 로케이션 (96%)</strong>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full" style={{ width: '96%' }} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-400" /> 실사 차이 발생 로케이션
          </span>
          <span className="text-[10px] text-slate-400">오차율: 4.2% (기준치 5% 이내)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead className="text-slate-400 border-b border-slate-800 pb-1">
              <tr>
                <th className="py-1.5 font-medium">로케이션</th>
                <th className="py-1.5 font-medium">품목명 / 코드</th>
                <th className="py-1.5 text-center font-medium">전산재고</th>
                <th className="py-1.5 text-center font-medium">실사재고</th>
                <th className="py-1.5 text-center font-medium">차이</th>
                <th className="py-1.5 text-right font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {items.map(it => (
                <tr key={it.id}>
                  <td className="py-2 font-mono font-bold text-indigo-300">{it.locCd}</td>
                  <td className="py-2">
                    <span className="text-white block font-medium">{it.productNm}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{it.productCd}</span>
                  </td>
                  <td className="py-2 text-center font-mono">{it.systemQty}</td>
                  <td className="py-2 text-center font-mono font-bold text-white">{it.countedQty}</td>
                  <td className="py-2 text-center font-mono font-bold">
                    <span className={it.diffQty > 0 ? 'text-cyan-400' : 'text-red-400'}>
                      {it.diffQty > 0 ? `+${it.diffQty}` : it.diffQty}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      it.status === 'ADJUSTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : it.diffType === 'SURPLUS'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {it.status === 'ADJUSTED' ? '원장보정 완료' : it.diffType === 'SURPLUS' ? '과다 (SURPLUS)' : '부족 (SHORTAGE)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6. 실시간 차량 GPS 레이더 & 지오펜싱 도착 관제 그리드
   ========================================================================= */

interface LiveVehicle {
  carNo: string;
  driverNm: string;
  speedKm: number;
  currentLocation: string;
  nextStop: string;
  geofenceDistM: number;
  status: 'DRIVING' | 'APPROACHING' | 'COMPLETED';
}

const LIVE_FLEET: LiveVehicle[] = [
  { carNo: '12가 3456', driverNm: '김민수 (1T 탑차)', speedKm: 58, currentLocation: '경부고속도로 양재IC 부근', nextStop: '서울 강남구 테헤란로 (Stop 1)', geofenceDistM: 320, status: 'APPROACHING' },
  { carNo: '34나 7890', driverNm: '박성훈 (2.5T 윙바디)', speedKm: 64, currentLocation: '분당수서간도로 수내교 부근', nextStop: '성남 분당구 황새울로 (Stop 3)', geofenceDistM: 1450, status: 'DRIVING' },
  { carNo: '56다 1122', driverNm: '이진호 (5T 윙바디)', speedKm: 72, currentLocation: '중부고속도로 이천TG 진입', nextStop: '이천 통합물류센터 착지', geofenceDistM: 2800, status: 'DRIVING' },
  { carNo: '78라 4455', driverNm: '최용준 (1T 카고)', speedKm: 0, currentLocation: '수원 영통구 영통로 고객 자택', nextStop: '배송 완료 하역중', geofenceDistM: 0, status: 'COMPLETED' },
];

function LiveFleetRadar() {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio size={18} className="animate-pulse" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white">실시간 차량 GPS 레이더 & 지오펜싱 500m 도착 관제</h3>
            <p className="text-xs text-slate-400">500m 반경 진입 시 고객 알림톡 자동 발송 및 하역 대기 트리거 연동</p>
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          4대 운행 관제중
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {LIVE_FLEET.map((v) => (
          <div
            key={v.carNo}
            className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-slate-400" />
                <span className="font-bold text-white text-xs">{v.carNo}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  v.status === 'APPROACHING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                    : v.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                {v.status === 'APPROACHING' ? '도착 320m 전 (접근중)' : v.status === 'COMPLETED' ? '하역 완료' : '정속 주행중'}
              </span>
            </div>

            <div className="text-[11px] space-y-1 text-slate-300">
              <p className="text-slate-400 text-[10px] truncate">{v.driverNm}</p>
              <p className="flex justify-between text-slate-400">
                <span>목적지:</span>
                <strong className="text-indigo-300 truncate max-w-[140px]">{v.nextStop}</strong>
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
              <span>속도: {v.speedKm} km/h</span>
              <span>지오펜스: {v.geofenceDistM}m</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   5. 메인 AI 관제 타워 페이지
   ========================================================================= */

export default function ControlTowerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* 상단 글로벌 헤더 */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            DOT2LINE
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
            <Sparkles size={11} className="text-indigo-400" /> AI Mission Control Tower
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>대시보드로 복귀</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* 메인 관제 센터 본문 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* 상단 타이틀 배너 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Full-Stack Autonomous Logistics Platform
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              차세대 AI 스마트 물류 통합 관제 센터
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3D 디지털 트윈 적재 시뮬레이터, VRP 2-Opt 경로 최적화 맵, 지오펜싱 레이더 및 AI 코파일럿 통합 운영
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Platform Health</span>
              <span className="text-xs font-bold text-emerald-400">전 도메인 100% 무결성 가동중</span>
            </div>
          </div>
        </div>

        {/* 1단 그리드: 3D 적재 시뮬레이터 + AI 코파일럿 대화 엔진 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Truck3DCubingViewer />
          </div>
          <div className="lg:col-span-5">
            <AiLogisticsCopilot />
          </div>
        </div>

        {/* 2단: VRP 2-Opt 배송 경로 최적화 인터랙티브 맵 */}
        <VrpRouteMapViewer />

        {/* 3단: 쇼핑몰 채널 수집 허브 & WMS 순환 재고실사 디지털 관제 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <ChannelSyncHub />
          </div>
          <div className="lg:col-span-6">
            <WmsCycleCountWidget />
          </div>
        </div>

        {/* 4단: 실시간 GPS 레이더 & 지오펜싱 도착 관제 그리드 */}
        <LiveFleetRadar />
      </main>
    </div>
  );
}
