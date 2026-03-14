import * as React from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Combobox = ComboboxPrimitive.Root

function ComboboxValue(props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({ className, children, ...props }) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-500 dark:hover:text-slate-300',
        className
      )}
      {...props}
    >
      {children || <ChevronDown className="h-4 w-4" />}
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxClear({ className, children, ...props }) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-500 dark:hover:text-slate-300',
        className
      )}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxInput({
  className,
  containerClassName,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}) {
  return (
    <div className={cn('relative', containerClassName)}>
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className={cn('input-base pr-11', className)}
        disabled={disabled}
        {...props}
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {showClear ? <ComboboxClear disabled={disabled} /> : null}
        {showTrigger ? <ComboboxTrigger disabled={disabled} /> : null}
      </div>
      {children}
    </div>
  )
}

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 8,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="z-50 outline-none"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          initialFocus={false}
          className={cn(
            'max-h-[var(--available-height)] w-[var(--anchor-width)] max-w-[var(--available-width)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-950 shadow-lg shadow-slate-200/70 outline-none transition-[opacity,transform] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:border-slate-800 dark:bg-[#070712] dark:text-slate-50 dark:shadow-black/30',
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn('max-h-72 overflow-y-auto overscroll-contain', className)}
      {...props}
    />
  )
}

function ComboboxItem({ className, children, ...props }) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'group relative flex w-full cursor-default items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 outline-none select-none transition data-[highlighted]:bg-slate-50 data-[highlighted]:text-slate-950 data-[selected]:bg-cyan-50 data-[selected]:text-cyan-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:text-slate-200 dark:data-[highlighted]:bg-slate-800/80 dark:data-[highlighted]:text-slate-50 dark:data-[selected]:bg-cyan-500/10 dark:data-[selected]:text-cyan-100',
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ComboboxPrimitive.ItemIndicator data-slot="combobox-item-indicator">
        <Check className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" className={cn('space-y-1', className)} {...props} />
}

function ComboboxLabel({ className, ...props }) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400', className)}
      {...props}
    />
  )
}

function ComboboxCollection(props) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
}

function ComboboxEmpty({ className, ...props }) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn('px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400', className)}
      {...props}
    />
  )
}

function ComboboxSeparator({ className, ...props }) {
  return <ComboboxPrimitive.Separator data-slot="combobox-separator" className={cn('my-1 h-px bg-slate-200 dark:bg-slate-800', className)} {...props} />
}

function useComboboxAnchor() {
  return React.useRef(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxValue,
  useComboboxAnchor,
}
