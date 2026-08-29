import { motion } from 'framer-motion'
import type { DashboardTrendPoint } from '../dashboard.types'

type TrendChartProps = {
  primary: DashboardTrendPoint[]
  secondary: DashboardTrendPoint[]
  primaryLabel: string
  secondaryLabel: string
  locale: string
}

type DistributionItem = {
  label: string
  value: number
}

function buildPath(values: number[], width: number, height: number, max: number) {
  if (!values.length) return ''
  const step = values.length > 1 ? width / (values.length - 1) : width
  return values
    .map((value, index) => {
      const x = index * step
      const y = height - (value / Math.max(1, max)) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function DashboardTrendChart({ primary, secondary, primaryLabel, secondaryLabel, locale }: TrendChartProps) {
  const width = 720
  const height = 220
  const primaryValues = primary.map((item) => item.count)
  const secondaryValues = secondary.map((item) => item.count)
  const max = Math.max(1, ...primaryValues, ...secondaryValues)
  const primaryPath = buildPath(primaryValues, width, height, max)
  const secondaryPath = buildPath(secondaryValues, width, height, max)
  const labels = primary.filter((_, index) => index === 0 || index === primary.length - 1 || index % 7 === 0)
  const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary" />{primaryLabel}</span>
        <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-400" />{secondaryLabel}</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/60 p-3">
        <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-[260px] w-full" role="img" aria-label={`${primaryLabel}, ${secondaryLabel}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} className="stroke-border/70" strokeWidth="1" />
          ))}
          <motion.path
            d={primaryPath}
            fill="none"
            className="stroke-primary"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          <motion.path
            d={secondaryPath}
            fill="none"
            className="stroke-amber-400"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          />
          {labels.map((item) => {
            const index = primary.findIndex((point) => point.date === item.date)
            const x = primary.length > 1 ? (index * width) / (primary.length - 1) : 0
            return (
              <text key={item.date} x={x} y={height + 25} textAnchor={index === 0 ? 'start' : index === primary.length - 1 ? 'end' : 'middle'} className="fill-muted-foreground text-[11px]">
                {formatter.format(new Date(`${item.date}T00:00:00`))}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function DashboardDistributionChart({ items }: { items: DistributionItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="tabular-nums text-muted-foreground">{new Intl.NumberFormat().format(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className={index === items.length - 1 ? 'h-full rounded-full bg-amber-400' : 'h-full rounded-full bg-primary'}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              transition={{ duration: 0.55, delay: index * 0.05, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardAccuracyRing({ value, label }: { value: number; label: string }) {
  const safeValue = Math.min(100, Math.max(0, value))
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dash = (safeValue / 100) * circumference

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-32 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`${label}: ${safeValue}%`}>
          <circle cx="60" cy="60" r={radius} fill="none" className="stroke-muted" strokeWidth="10" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            className="stroke-primary"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums text-foreground">{safeValue.toFixed(1)}%</div>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm leading-6 text-muted-foreground">{safeValue >= 70 ? '✓' : '•'}</p>
      </div>
    </div>
  )
}
