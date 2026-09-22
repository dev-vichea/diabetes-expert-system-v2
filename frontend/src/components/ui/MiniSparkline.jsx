import React from 'react'

/**
 * MiniSparkline: Ultra-smooth cubic Bezier spline with Catmull-Rom formulation
 * Renders subpixel precision curves with soft gradient area fills.
 */
export function MiniSparkline({
  points = [],
  strokeColor = '#3b82f6',
  fillColor = '#3b82f6',
  width = 100,
  height = 30,
  padX = 2,
  padY = 4,
  className = '',
}) {
  if (!points || points.length < 2) {
    return <div className={`h-[${height}px] w-full`} />
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const coords = points.map((val, idx) => {
    const x = padX + (idx / (points.length - 1)) * (width - padX * 2)
    const y = height - padY - ((val - min) / range) * (height - padY * 2)
    return [x, y]
  })

  // Continuous cubic Bezier spline (Catmull-Rom formulation)
  let linePath = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`
  const tension = 0.22

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = i > 0 ? coords[i - 1] : coords[i]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = i < coords.length - 2 ? coords[i + 2] : p2

    const cp1x = p1[0] + (p2[0] - p0[0]) * tension
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }

  const lastCoord = coords[coords.length - 1]
  const firstCoord = coords[0]
  const areaPath = `${linePath} L ${lastCoord[0].toFixed(1)} ${height} L ${firstCoord[0].toFixed(1)} ${height} Z`
  const gradId = `sparkline-grad-${strokeColor.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).slice(2, 7)}`

  return (
    <div className={`h-[${height}px] w-full select-none ${className}`} aria-hidden="true">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Soft pulse dot on the latest coordinate */}
        <circle
          cx={lastCoord[0]}
          cy={lastCoord[1]}
          r="2.5"
          fill={strokeColor}
          className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
        />
      </svg>
    </div>
  )
}
export default MiniSparkline
