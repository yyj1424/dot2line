'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot, Sparkles, Truck, Box, Navigation, ShieldCheck,
  AlertTriangle, ArrowRight, RefreshCw, Eye, Play, Pause,
  RotateCw, ZoomIn, ZoomOut, CheckCircle2, ChevronRight,
  Layers, MapPin, Gauge, Activity, Radio, Cpu, Send,
  Sliders, ArrowUpRight
} from 'lucide-react';

/* =========================================================================
   1. 3D 디지털 트윈 트럭 적재 시뮬레이터 (HTML5 Canvas 3D Engine)
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
}

const TRUCK_DIMENSIONS = {
  length: 6200, // mm (Z)
  width: 2300,  // mm (X)
  height: 2400, // mm (Y)
};

const SAMPLE_CARGO: CargoBox[] = [
  // 5번 정류장 화물 (가장 안쪽 적재)
  { id: 'BX-001', name: '원목 식탁 상판', consignee: '최*희 (용인 기흥)', stop: 5, color: '#6366f1', x: 200, y: 0, z: 200, w: 900, h: 400, d: 1800, weightKg: 35.0 },
  { id: 'BX-002', name: '의자 박스 A (2개입)', consignee: '최*희 (용인 기흥)', stop: 5, color: '#818cf8', x: 1200, y: 0, z: 200, w: 900, h: 800, d: 800, weightKg: 18.0 },
  { id: 'BX-003', name: '의자 박스 B (2개입)', consignee: '최*희 (용인 기흥)', stop: 5, color: '#818cf8', x: 1200, y: 0, z: 1100, w: 900, h: 800, d: 800, weightKg: 18.0 },

  // 4번 정류장 화물
  { id: 'BX-004', name: '패브릭 리클라이너', consignee: '정*우 (수원 영통)', stop: 4, color: '#06b6d4', x: 200, y: 0, z: 2100, w: 1000, h: 1100, d: 1100, weightKg: 42.0 },
  { id: 'BX-005', name: '스탠드 조명 패키지', consignee: '정*우 (수원 영통)', stop: 4, color: '#22d3ee', x: 1300, y: 0, z: 2100, w: 800, h: 1200, d: 800, weightKg: 15.0 },

  // 3번 정류장 화물
  { id: 'BX-006', name: '3단 서랍장', consignee: '김*수 (성남 분당)', stop: 3, color: '#10b981', x: 200, y: 0, z: 3300, w: 900, h: 900, d: 1200, weightKg: 28.0 },
  { id: 'BX-007', name: '협탁 2종 세트', consignee: '김*수 (성남 분당)', stop: 3, color: '#34d399', x: 1200, y: 0, z: 3300, w: 900, h: 700, d: 900, weightKg: 16.0 },

  // 2번 정류장 화물
  { id: 'BX-008', name: '오피스 메쉬 체어', consignee: '이*진 (서울 서초)', stop: 2, color: '#f59e0b', x: 200, y: 0, z: 4600, w: 800, h: 950, d: 800, weightKg: 14.5 },
  { id: 'BX-009', name: '모션데스크 프레임', consignee: '이*진 (서울 서초)', stop: 2, color: '#fbbf24', x: 1100, y: 0, z: 4300, w: 1000, h: 400, d: 1500, weightKg: 32.0 },

  // 1번 정류장 화물 (가장 앞문/도어 쪽 적재 - 첫 번째 배송)
  { id: 'BX-010', name: '에어 서큘레이터 대형', consignee: '박*훈 (서울 강남)', stop: 1, color: '#ec4899', x: 300, y: 0, z: 5450, w: 600, h: 600, d: 650, weightKg: 8.5 },
  { id: 'BX-011', name: '인체공학 모니터암', consignee: '박*훈 (서울 강남)', stop: 1, color: '#f472b6', x: 1000, y: 0, z: 5450, w: 500, h: 400, d: 600, weightKg: 6.0 },
];

function Truck3DCubingViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState(25);
  const [rotY, setRotY] = useState(45);
  const [zoom, setZoom] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [currentStep, setCurrentStep] = useState(5); // 1~5 단계별 상차
  const [selectedBox, setSelectedBox] = useState<CargoBox | null>(null);

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
    const cy = height / 2 + 60;

    // 3D ➔ 2D 등각 투영 변환
    const project = (x: number, y: number, z: number) => {
      // 트럭 중심축(0,0,0) 기준 오프셋
      const ox = x - TRUCK_DIMENSIONS.width / 2;
      const oy = y - TRUCK_DIMENSIONS.height / 2;
      const oz = z - TRUCK_DIMENSIONS.length / 2;

      // Y축 회전 (Yaw)
      const x1 = ox * cosY + oz * sinY;
      const z1 = -ox * sinY + oz * cosY;

      // X축 회전 (Pitch)
      const y2 = oy * cosX - z1 * sinX;
      const z2 = oy * sinX + z1 * cosX;

      return {
        px: cx + x1 * scale,
        py: cy - y2 * scale,
        depth: z2,
      };
    };

    // 1. 바닥 그림자 & 격자 그리드 그리기
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
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

    // 2. 트럭 컨테이너 투명 프레임 섀시 그리기
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

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

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

    // 3. 화물 박스 렌더링 (현재 적재 단계에 해당하는 박스만)
    const visibleBoxes = SAMPLE_CARGO.filter((b) => b.stop >= 6 - currentStep);

    // 깊이 정렬 (Painter's Algorithm)
    const sortedBoxes = visibleBoxes.map((b) => {
      const center = project(b.x + b.w / 2, b.y + b.h / 2, b.z + b.d / 2);
      return { box: b, depth: center.depth };
    }).sort((a, b) => a.depth - b.depth);

    sortedBoxes.forEach(({ box }) => {
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

      // 상단면 (Top Face)
      ctx.fillStyle = box.color;
      ctx.beginPath();
      ctx.moveTo(p3.px, p3.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.lineTo(p6.px, p6.py);
      ctx.lineTo(p7.px, p7.py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 전면 (Front Face)
      ctx.fillStyle = adjustBrightness(box.color, -20);
      ctx.beginPath();
      ctx.moveTo(p4.px, p4.py);
      ctx.lineTo(p5.px, p5.py);
      ctx.lineTo(p6.px, p6.py);
      ctx.lineTo(p7.px, p7.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 우측면 (Right Face)
      ctx.fillStyle = adjustBrightness(box.color, -35);
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p5.px, p5.py);
      ctx.lineTo(p6.px, p6.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

  }, [rotX, rotY, zoom, currentStep]);

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
              <Box size={18} />
            </span>
            <h3 className="text-base font-bold text-white">
              3D 디지털 트윈 트럭 적재 시뮬레이터 (Cubing Engine)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            5T 윙바디 기준 LIFO(후입선출) 역순 적재 및 실시간 3D AABB 공간 최적화 시각화
          </p>
        </div>

        {/* 3D 뷰어 인터랙션 컨트롤러 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRotX(25); setRotY(45); setZoom(0.85); }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            title="기본 시점 복원"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            title="확대"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            title="축소"
          >
            <ZoomOut size={14} />
          </button>
        </div>
      </div>

      {/* 3D Canvas 영역 */}
      <div
        className="relative w-full h-80 sm:h-96 bg-gradient-to-b from-slate-950/80 to-slate-900/90 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
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
          <div className="px-2.5 py-1 bg-slate-900/80 border border-slate-700/60 rounded-lg backdrop-blur text-[11px] text-slate-300 flex items-center gap-2">
            <span className="text-slate-500">차량 규격:</span>
            <strong className="text-white">5T 윙바디 (6.2m × 2.3m × 2.4m)</strong>
          </div>
          <div className="px-2.5 py-1 bg-slate-900/80 border border-slate-700/60 rounded-lg backdrop-blur text-[11px] text-slate-300 flex items-center gap-2">
            <span className="text-slate-500">공간 적재율:</span>
            <strong className="text-emerald-400">{volumeEfficiency}%</strong>
            <span className="text-[10px] text-slate-400">({loadedVolumeCbm} / {totalCapacityCbm} CBM)</span>
          </div>
        </div>

        {/* 우측 상단 LIFO 정류장 안내 뱃지 */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right mb-0.5">LIFO 하차 순번</span>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm" />
            <span className="text-[10px] text-slate-300">Stop 1 (강남)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
            <span className="text-[10px] text-slate-300">Stop 2 (서초)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-[10px] text-slate-300">Stop 3 (분당)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm" />
            <span className="text-[10px] text-slate-300">Stop 4 (영통)</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
            <span className="text-[10px] text-slate-300">Stop 5 (기흥)</span>
          </div>
        </div>

        {/* 하단 회전 가이드 안내 */}
        <div className="absolute bottom-2 text-center text-[10px] text-slate-500 pointer-events-none">
          마우스 클릭 드래그로 360도 3D 회전 및 적재 상태를 입체 검사할 수 있습니다.
        </div>
      </div>

      {/* 단계별 상차 시뮬레이션 슬라이더 */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders size={13} className="text-indigo-400" />
            스텝별 상차 단계 시뮬레이션:
            <strong className="text-indigo-300">총 5개 경유지 중 {currentStep}단계 적재중</strong>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {currentStep === 5 ? '만차 상차 완료 (LIFO 적재 확정)' : `${5 - currentStep}개 배송지 대기`}
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
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>Step 1 (안쪽 5번 정류장)</span>
          <span>Step 2 (4번)</span>
          <span>Step 3 (3번)</span>
          <span>Step 4 (2번)</span>
          <span>Step 5 (도어 1번 정류장)</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. AI 지능형 코파일럿 (Autonomous Logistics Copilot)
   ========================================================================= */

interface CopilotQuery {
  id: string;
  prompt: string;
  category: 'CAPA' | 'BOM' | 'VRP' | 'SETTLE';
  icon: React.ReactNode;
}

const PRESET_QUERIES: CopilotQuery[] = [
  {
    id: 'q1',
    prompt: '강남권역 CAPA 140% 초과 감지 및 실시간 AI 증차/배차 대안 제시',
    category: 'CAPA',
    icon: <Gauge size={14} className="text-amber-400" />,
  },
  {
    id: 'q2',
    prompt: '원목 식탁 세트(BOM) 출고 전 구성품 수불 및 병목(Bottleneck) 부품 진단',
    category: 'BOM',
    icon: <Layers size={14} className="text-indigo-400" />,
  },
  {
    id: 'q3',
    prompt: '이천 허브 출발 7개 배송지 2-Opt 휴리스틱 TSP 최적 경로 산출 및 거리 단축률',
    category: 'VRP',
    icon: <Navigation size={14} className="text-cyan-400" />,
  },
  {
    id: 'q4',
    prompt: '오피넷 실시간 유류할증료 연동 및 배송기사 당일 빠른정산(Factoring) 시뮬레이션',
    category: 'SETTLE',
    icon: <ShieldCheck size={14} className="text-emerald-400" />,
  },
];

function AiLogisticsCopilot() {
  const [activeQuery, setActiveQuery] = useState<string>('q1');
  const [customInput, setCustomInput] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [autoPilotStatus, setAutoPilotStatus] = useState<string>('ACTIVE');

  const handleSelectQuery = (id: string) => {
    setActiveQuery(id);
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 400);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              DOT2LINE AI 스마트 물류 코파일럿
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold animate-pulse">
                Autonomous Copilot
              </span>
            </h3>
            <p className="text-xs text-slate-400">자연어 지시 및 실시간 다차원 제약 최적화 솔루션</p>
          </div>
        </div>

        <button
          onClick={() => setAutoPilotStatus((s) => (s === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            autoPilotStatus === 'ACTIVE'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/30'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Activity size={13} className={autoPilotStatus === 'ACTIVE' ? 'animate-spin' : ''} />
          <span>Auto-Pilot: {autoPilotStatus}</span>
        </button>
      </div>

      {/* 스마트 질의 프리셋 칩 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PRESET_QUERIES.map((q) => (
          <button
            key={q.id}
            onClick={() => handleSelectQuery(q.id)}
            className={`flex items-start gap-2.5 p-3 rounded-xl text-xs text-left transition ${
              activeQuery === q.id
                ? 'bg-indigo-600/20 border border-indigo-500/50 text-white shadow-sm'
                : 'bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <span className="mt-0.5">{q.icon}</span>
            <span className="flex-1 font-medium leading-relaxed">{q.prompt}</span>
          </button>
        ))}
      </div>

      {/* 실시간 AI 분석 리포트 카드 */}
      <div className="p-4 bg-slate-950/70 border border-indigo-500/20 rounded-xl space-y-3 relative overflow-hidden">
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center z-10 text-xs text-indigo-400 font-semibold animate-pulse">
            AI 엔진이 실시간 수불 원장 및 배차 제약조건을 대사 중입니다...
          </div>
        )}

        {activeQuery === 'q1' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={14} /> [위험 감지] 강남/서초권역 당일 배송 부하율 140.0% 초과
              </span>
              <span className="text-[10px] text-slate-400 font-mono">초과 용적: +12.0 CBM</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              설정 허용 CAPA(30.0 CBM) 대비 현재 확정 접수 주문(42.0 CBM)이 12 CBM 초과 발생하였습니다.
              인접 <strong className="text-white">송파/강동권역(부하율 58%)</strong>으로 분산 배치하거나 아래 추천 차량 증차를 승인해 주세요.
            </p>
            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400 block">AI 권장 차량 추천</span>
                <span className="font-bold text-indigo-300">2.5T 중형 윙바디 1대 긴급 투입 승인</span>
              </div>
              <button
                onClick={() => alert('AI 추천에 따라 2.5T 윙바디 차량 배차가 자동 생성되었습니다.')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition active:scale-95 flex items-center gap-1"
              >
                <span>원클릭 승인</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        {activeQuery === 'q2' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                <Layers size={14} /> [BOM 수불 검증] 4인 원목 식탁세트 출고 피킹 진단
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[10px]">
                출고 차단 (LACK_OF_COMPONENT)
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              5세트 출고 요청 접수 결과: 상판(15개)과 볼트팩(100개)은 충분하나, <strong className="text-red-400">원목 체어(필요 20개 / 가용 8개)</strong>의 재고가 12개 부족합니다.
              부분 출고 방지 가드레일에 의해 피킹 승인이 보류되었으며, 최대 조립 가능 수량은 <strong className="text-emerald-400">2세트</strong>입니다.
            </p>
            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400 block">AI 추천 조치</span>
                <span className="font-bold text-white">2세트 분할 출고 우선 승인 + 3세트 납기 D+2일 재약속</span>
              </div>
              <button
                onClick={() => alert('2세트 우선 출고 분할 전표가 생성되었습니다.')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition active:scale-95"
              >
                2세트 우선 분할
              </button>
            </div>
          </div>
        )}

        {activeQuery === 'q3' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <Navigation size={14} /> [VRP 2-Opt] 이천 허브 배송 7개 경유지 경로 최적화
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">운행거리 19.3% 절감</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              초기 순차 경로(64.2 km / 148분)를 2-Opt TSP 교차선 제거 알고리즘으로 최적화하여 <strong className="text-emerald-400">51.8 km / 116분</strong>으로 단축하였습니다.
              배송 순번: 이천 허브 ➔ 기흥(Stop 5) ➔ 영통(Stop 4) ➔ 분당(Stop 3) ➔ 서초(Stop 2) ➔ 강남(Stop 1).
            </p>
            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400 block">예상 탄소 및 연료 절감</span>
                <span className="font-bold text-white">경유 2.6L 절감 / 온실가스 6.8kg CO₂e 감축</span>
              </div>
              <button
                onClick={() => alert('기사 모바일 앱 내비게이션으로 최적 순번이 전송되었습니다.')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition active:scale-95"
              >
                기사 앱 전송
              </button>
            </div>
          </div>
        )}

        {activeQuery === 'q4' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={14} /> [정산 가드] 오피넷 유가 연동 할증 & 당일 빠른정산
              </span>
              <span className="text-[10px] text-slate-400 font-mono">한국석유공사 Opinet API 실시간 연동</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              금일 서울/경기 경유 기준 유가 1,625원 반영(기준유가 1,500원 초과율 +8.33%).
              운송 기본운임 220,000원에 유류할증료 18,300원 자동 가산. 당일 빠른정산 팩토링 수수료 1.5% 공제 후 234,720원 즉시 출금 가용.
            </p>
            <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400 block">기사 당일 즉시 입금액</span>
                <span className="font-bold text-emerald-400 text-sm">₩ 234,720 (원천징수 전산 반영완료)</span>
              </div>
              <button
                onClick={() => alert('기사 계좌로 당일 빠른정산 지급이 승인되었습니다.')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition active:scale-95"
              >
                당일 즉시 지급
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 자연어 질의 입력창 */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="AI 코파일럿에게 물류 운영 지시를 입력하세요 (예: 미마감 주문 사유 분석 및 재배송안)"
          className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && customInput.trim()) {
              alert(`[AI Copilot 수신]: "${customInput}" 에 대한 플랫폼 룰 및 API 대사가 실행되었습니다.`);
              setCustomInput('');
            }
          }}
        />
        <button
          onClick={() => {
            if (customInput.trim()) {
              alert(`[AI Copilot 수신]: "${customInput}" 에 대한 플랫폼 룰 및 API 대사가 실행되었습니다.`);
              setCustomInput('');
            }
          }}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   3. 실시간 차량 GPS 레이더 & 지오펜싱 도착 관제 그리드
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
            <h3 className="text-base font-bold text-white">실시간 차량 GPS 레이더 & 지오펜싱 도착 감지</h3>
            <p className="text-xs text-slate-400">500m 반경 진입 시 고객 알림톡 자동 발송 및 하역 대기 트리거</p>
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          4대 운행 관제중
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LIVE_FLEET.map((v) => (
          <div
            key={v.carNo}
            className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-slate-400" />
                <span className="font-bold text-white text-xs">{v.carNo}</span>
                <span className="text-[11px] text-slate-400">({v.driverNm})</span>
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
              <p className="flex justify-between text-slate-400">
                <span>현재 위치:</span>
                <strong className="text-slate-200">{v.currentLocation}</strong>
              </p>
              <p className="flex justify-between text-slate-400">
                <span>다음 목적지:</span>
                <strong className="text-indigo-300">{v.nextStop}</strong>
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
              <span>속도: {v.speedKm} km/h</span>
              <span>지오펜스 잔여: {v.geofenceDistM} m</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   4. 메인 AI 관제 타워 페이지 레이아웃
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
        {/* 상단 헤더 배너 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Full-Stack AI Autonomous Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI 스마트 물류 통합 관제 센터
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              3D 디지털 트윈 적재 시뮬레이터, 실시간 VRP 경로 최적화, 지오펜싱 레이더 및 AI 코파일럿이 유기적으로 결합된 차세대 관제 시스템
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Platform Health</span>
              <span className="text-xs font-bold text-emerald-400">10개 전 도메인 무결성 가동중</span>
            </div>
          </div>
        </div>

        {/* 2단 그리드: 3D 적재 시뮬레이터 + AI 코파일럿 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Truck3DCubingViewer />
          </div>
          <div className="lg:col-span-5">
            <AiLogisticsCopilot />
          </div>
        </div>

        {/* 하단: 실시간 GPS 레이더 & 지오펜싱 도착 관제 그리드 */}
        <LiveFleetRadar />
      </main>
    </div>
  );
}
