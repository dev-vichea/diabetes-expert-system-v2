import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils'

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }
  return context
}

function getPayloadConfigFromPayload(config, payload, key) {
  if (!payload || typeof payload !== 'object') return undefined

  const payloadKey = key || payload.dataKey || payload.name
  if (payloadKey && payloadKey in config) return config[payloadKey]

  if (payload.payload && typeof payload.payload === 'object') {
    const nestedKey = key || payload.payload.dataKey || payload.payload.name
    if (nestedKey && nestedKey in config) return config[nestedKey]
  }

  return undefined
}

function ChartStyle({ id, config }) {
  const colors = Object.entries(config || {}).filter(([, value]) => value?.color)
  if (!colors.length) return null

  const cssVars = colors
    .map(([key, value]) => `  --color-${key}: ${value.color};`)
    .join('\n')

  return (
    <style>
      {`
[data-chart="${id}"] {
${cssVars}
}
      `}
    </style>
  )
}

const ChartContainer = React.forwardRef(({ id, className, children, config = {}, ...props }, ref) => {
  const uniqueId = React.useId().replace(/:/g, '')
  const chartId = `chart-${id || uniqueId}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        className={cn(
          'flex aspect-video justify-center text-xs',
          '[&_.recharts-cartesian-axis-tick_text]:fill-slate-500',
          '[&_.recharts-cartesian-grid_line]:stroke-slate-200',
          '[&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-slate-200',
          '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-slate-100',
          '[&_.recharts-reference-line_[stroke="#ccc"]]:stroke-slate-300',
          'dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-400',
          'dark:[&_.recharts-cartesian-grid_line]:stroke-slate-700',
          'dark:[&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-slate-700',
          'dark:[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-slate-800',
          'dark:[&_.recharts-reference-line_[stroke="#ccc"]]:stroke-slate-600',
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    if (!active || !payload?.length) return null

    const tooltipLabel = !hideLabel
      ? (labelFormatter ? labelFormatter(label, payload) : label)
      : null

    return (
      <div
        ref={ref}
        className={cn(
          'dark-hover-border grid min-w-40 items-start gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-md dark:border-slate-700 dark:bg-[#070712]',
          className
        )}
      >
        {tooltipLabel ? (
          <p className="px-1 text-xs font-medium text-slate-500 dark:text-slate-400">{tooltipLabel}</p>
        ) : null}
        <div className="grid gap-1">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload?.fill || item.color
            const itemLabel = itemConfig?.label || item.payload?.[labelKey || 'label'] || item.name

            return (
              <div key={`${key}-${index}`} className="flex items-center gap-2 px-1 text-xs">
                {!hideIndicator ? (
                  <span
                    className={cn(
                      'shrink-0 rounded-[2px]',
                      indicator === 'dot' ? 'h-2 w-2 rounded-full' : 'h-2.5 w-1'
                    )}
                    style={{ backgroundColor: indicatorColor }}
                  />
                ) : null}
                <span className="flex-1 text-slate-600 dark:text-slate-300">{itemLabel}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatter ? formatter(item.value, item.name, item, item.payload) : item.value}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = 'ChartTooltipContent'

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef(
  ({ className, payload, hideIcon = false, nameKey }, ref) => {
    const { config } = useChart()

    if (!payload?.length) return null

    return (
      <div ref={ref} className={cn('flex flex-wrap items-center justify-center gap-4 pt-2', className)}>
        {payload.map((item, index) => {
          const key = `${nameKey || item.dataKey || item.value || 'value'}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)
          const color = item.color || item.payload?.fill

          return (
            <div key={`${key}-${index}`} className="flex items-center gap-1.5">
              {!hideIcon ? (
                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
              ) : null}
              <span className="text-xs text-slate-600 dark:text-slate-300">{itemConfig?.label || item.value}</span>
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = 'ChartLegendContent'

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
