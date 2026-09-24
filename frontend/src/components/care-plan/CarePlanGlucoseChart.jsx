import { useState } from 'react'

/**
 * CarePlanGlucoseChart
 * Sleek SVG sparkline chart mirroring the reference design:
 * - Y-Axis indicators for 400, 300, 200, 100 mg/dL
 * - 7-day trend (Sep 18 - 24)
 * - Smooth Bezier spline
 * - Highlighting of latest elevated reading with a pulsating rose dot
 * - Interactive hover tooltip
 */
export function CarePlanGlucoseChart({
  latestGlucose = 260,
  targetMin = 80,
  targetMax = 130,
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // 7-day reading points ending with latest reading
  const chartPoints = [
    { label: 'Sep 18', day: '18', val: 145 },
    { label: 'Sep 19', day: '19', val: 160 },
    { label: 'Sep 20', day: '20', val: 152 },
    { label: 'Sep 21', day: '21', val: 185 },
    { label: 'Sep 22', day: '22', val: 155 },
    { label: 'Sep 23', day: '23', val: 158 },
    { label: 'Sep 24', day: '24', val: latestGlucose || 260 },
  ]

  // Chart coordinate mappings (viewBox: 0 0 380 135)
  const leftX = 35
  const rightX = 355
  const widthRange = rightX - leftX
  const stepX = widthRange / (chartPoints.length - 1)

  const yMinVal = 100
  const yMaxVal = 400
  const yTop = 16
  const yBottom = 98
  const heightRange = yBottom - yTop

  const getY = (val) => {
    const clamped = Math.max(80, Math.min(420, val))
    const ratio = (clamped - yMinVal) / (yMaxVal - yMinVal)
    return yBottom - ratio * heightRange
  }

  const coords = chartPoints.map((p, idx) => ({
    ...p,
    x: leftX + idx * stepX,
    y: getY(p.val),
  }))

  // Smooth cubic Bezier spline
  let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  const tension = 0.22
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = i > 0 ? coords[i - 1] : coords[i]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = i < coords.length - 2 ? coords[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  const lastCoord = coords[coords.length - 1]
  const firstCoord = coords[0]
  const areaPath = `${linePath} L ${lastCoord.x.toFixed(1)} ${yBottom} L ${firstCoord.x.toFixed(1)} ${yBottom} Z`

  const yTicks = [
    { label: '400', y: getY(400) },
    { label: '300', y: getY(300) },
    { label: '200', y: getY(200) },
    { label: '100', y: getY(100) },
  ]

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox="0 0 380 135"
        className="w-full h-auto overflow-visible"
        style={{ minHeight: '120px' }}
      >
        <defs>
          <linearGradient id="carePlanGlucoseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines and Y-axis tick values */}
        {yTicks.map((tick) => (
          <g key={tick.label}>
            <text
              x="24"
              y={tick.y + 3.5}
              textAnchor="end"
              className="text-[9px] font-medium fill-slate-400 dark:fill-slate-500"
            >
              {tick.label}
            </text>
            <line
              x1={leftX}
              y1={tick.y}
              x2={rightX}
              y2={tick.y}
              className="stroke-slate-100 dark:stroke-slate-800/80"
              strokeDasharray="2 3"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Soft area under curve */}
        <path d={areaPath} fill="url(#carePlanGlucoseGrad)" />

        {/* Main curve line */}
        <path
          d={linePath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Historical and current coordinate dots */}
        {coords.map((pt, i) => {
          const isLatest = i === coords.length - 1
          const isHovered = hoveredPoint?.label === pt.label
          const isHigh = pt.val > targetMax

          return (
            <g
              key={pt.label}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Invisible larger hit target for easy touch / hover */}
              <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />

              {/* Glowing halo for elevated latest dot */}
              {isLatest && isHigh && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="7.5"
                  fill="#f43f5e"
                  fillOpacity="0.25"
                  className="animate-pulse"
                />
              )}

              {/* Dot marker */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isLatest ? (isHovered ? '4.5' : '3.8') : isHovered ? '3.5' : '2.8'}
                fill={isLatest && isHigh ? '#f43f5e' : '#0284c7'}
                stroke="#ffffff"
                strokeWidth={isLatest ? '1.8' : '1.2'}
              />

              {/* X-axis date labels */}
              <text
                x={pt.x}
                y="120"
                textAnchor="middle"
                className={`text-[9.5px] font-medium transition-colors ${
                  isLatest
                    ? 'fill-slate-800 font-bold dark:fill-slate-200'
                    : 'fill-slate-400 dark:fill-slate-500'
                }`}
              >
                {i === 0 ? pt.label : pt.day}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full pointer-events-none rounded-lg border border-slate-200 bg-white/95 px-2 py-1 shadow-md backdrop-blur-xs text-[11px] font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
          style={{
            left: `${(hoveredPoint.x / 380) * 100}%`,
            top: `${(hoveredPoint.y / 135) * 100 - 8}%`,
          }}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="font-bold">{hoveredPoint.val} mg/dL</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                hoveredPoint.val > targetMax
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : hoveredPoint.val < targetMin
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {hoveredPoint.val > targetMax
                ? 'Above target'
                : hoveredPoint.val < targetMin
                  ? 'Below target'
                  : 'In range'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CarePlanGlucoseChart
