import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export function Sparkline({ data = [], color = '#1f76e8', className, height = 40 }) {
  const gradientId = useMemo(() => `spark-gradient-${Math.random().toString(36).slice(2, 9)}`, [])
  const safeData = data.length ? data : [{ value: 0 }, { value: 0 }]

  return (
    <div className={cn('min-w-0', className)} style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={safeData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={safeData.length === 1 ? { r: 2.5, fill: color, strokeWidth: 0 } : false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}