import React, { useState } from "react";

export default function AttendanceTrendCard({ attendanceData }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const records = attendanceData || [
    { label: "T2", date: "28/09", onTime: 18, late: 1, leave: 0, total: 19 },
    { label: "T3", date: "29/09", onTime: 17, late: 1, leave: 1, total: 19 },
    { label: "T4", date: "30/09", onTime: 19, late: 0, leave: 0, total: 19 },
    { label: "T5", date: "01/10", onTime: 16, late: 2, leave: 1, total: 19 },
    { label: "T6", date: "02/10", onTime: 17, late: 2, leave: 0, total: 19 },
    { label: "T7", date: "03/10", onTime: 14, late: 1, leave: 0, total: 15 },
    { label: "Nay", date: "04/10", onTime: 16, late: 2, leave: 0, total: 19 },
  ];

  // SVG Chart Geometry
  const svgWidth = 360;
  const svgHeight = 175;
  const padX = 26;
  const padYTop = 20;
  const padYBottom = 38;
  const plotH = svgHeight - padYTop - padYBottom; // 117
  const maxVal = 20;
  const stepX = (svgWidth - padX * 2) / (records.length - 1);

  // Compute points
  const onTimePoints = records.map((r, i) => ({
    x: padX + i * stepX,
    y: padYTop + plotH - (r.onTime / maxVal) * plotH,
    val: r.onTime,
    ...r,
  }));

  const latePoints = records.map((r, i) => ({
    x: padX + i * stepX,
    y: padYTop + plotH - (r.late / maxVal) * plotH,
    val: r.late,
    ...r,
  }));

  // Helper to build smooth cubic bezier curve
  const createSmoothPath = (pts) => {
    if (!pts || pts.length === 0) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const onTimePath = createSmoothPath(onTimePoints);
  const latePath = createSmoothPath(latePoints);

  const baselineY = padYTop + plotH;
  const onTimeArea = `${onTimePath} L ${onTimePoints[onTimePoints.length - 1].x.toFixed(1)} ${baselineY} L ${onTimePoints[0].x.toFixed(1)} ${baselineY} Z`;
  const lateArea = `${latePath} L ${latePoints[latePoints.length - 1].x.toFixed(1)} ${baselineY} L ${latePoints[0].x.toFixed(1)} ${baselineY} Z`;

  const activeRecord = hoverIndex !== null ? records[hoverIndex] : null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      <div>
        {/* Header Tiêu đề & Chú thích */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-sm text-slate-900 tracking-wider uppercase">
              XU HƯỚNG CHẤM CÔNG 7 NGÀY
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Tỷ lệ đi làm và chấp hành giờ giấc</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Đúng giờ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Đi trễ
            </span>
          </div>
        </div>

        {/* Khung Biểu đồ đường SVG tương tác */}
        <div className="relative w-full my-1">
          {/* Tooltip khi rê chuột vào điểm */}
          {activeRecord && (
            <div
              className="absolute -top-1 pointer-events-none transform -translate-x-1/2 bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg z-20 whitespace-nowrap transition-all"
              style={{
                left: `${(padX + hoverIndex * stepX) / svgWidth * 100}%`,
              }}
            >
              <div className="font-semibold text-slate-200">{activeRecord.label} ({activeRecord.date})</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-emerald-400">{activeRecord.onTime} Đúng giờ</span>
                <span>•</span>
                <span className="text-amber-400">{activeRecord.late} Đi trễ</span>
              </div>
            </div>
          )}

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              {/* Gradient xanh cho Đúng giờ */}
              <linearGradient id="onTimeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Gradient cam cho Đi trễ */}
              <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Các đường gióng ngang mờ */}
            {[5, 10, 15, 20].map((v) => {
              const y = padYTop + plotH - (v / maxVal) * plotH;
              return (
                <line
                  key={v}
                  x1={padX - 8}
                  y1={y}
                  x2={svgWidth - padX + 8}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Vùng đổ màu Gradient Đúng giờ */}
            <path d={onTimeArea} fill="url(#onTimeGrad)" />

            {/* Vùng đổ màu Gradient Đi trễ */}
            <path d={lateArea} fill="url(#lateGrad)" />

            {/* Đường biểu đồ Đi trễ */}
            <path
              d={latePath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Đường biểu đồ Đúng giờ */}
            <path
              d={onTimePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Các điểm mốc Đúng giờ (Green Dots) */}
            {onTimePoints.map((pt, idx) => (
              <g key={`ontime-${idx}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverIndex === idx ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="transition-all duration-200"
                />
              </g>
            ))}

            {/* Các điểm mốc Đi trễ (Amber Dots) */}
            {latePoints.map((pt, idx) => (
              <g key={`late-${idx}`}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverIndex === idx ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  className="transition-all duration-200"
                />
              </g>
            ))}

            {/* Vùng tương tác hover từng cột */}
            {records.map((r, idx) => {
              const xCenter = padX + idx * stepX;
              return (
                <rect
                  key={`hover-${idx}`}
                  x={xCenter - stepX / 2}
                  y={0}
                  width={stepX}
                  height={svgHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}

            {/* Trục X: Nhãn Thứ & Ngày bên dưới từng điểm mốc */}
            {records.map((r, idx) => {
              const xPos = padX + idx * stepX;
              const isToday = idx === records.length - 1;
              return (
                <g key={`label-${idx}`} className="pointer-events-none">
                  <text
                    x={xPos}
                    y={svgHeight - 16}
                    textAnchor="middle"
                    className={`text-[11px] font-semibold ${
                      isToday ? "fill-sky-600 font-bold" : "fill-slate-700"
                    }`}
                  >
                    {r.label}
                  </text>
                  <text
                    x={xPos}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-400"
                  >
                    {r.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Footer sạch sẽ, đã bỏ hoàn toàn "Đạt ...%" */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
        <span>Ca làm việc chuẩn: 08:00 – 17:00</span>
        <span className="font-medium text-slate-600">Theo dõi 7 ngày gần nhất</span>
      </div>
    </div>
  );
}
