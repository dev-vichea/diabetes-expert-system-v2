import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMPTY_VALUE = '__empty__'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(({ className, children, showIcon = true, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'dark-hover-border inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm ring-offset-white transition-colors placeholder:text-slate-400 hover:bg-slate-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#0c1024] dark:text-slate-100 dark:ring-offset-[#030309] dark:hover:bg-[#131a33] dark:focus:ring-primary-500/30 [&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    {showIcon ? (
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 dark:text-slate-400" />
      </SelectPrimitive.Icon>
    ) : null}
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-slate-400', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-slate-400', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0c1024] dark:text-slate-200 dark:shadow-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1.5 data-[side=left]:-translate-x-1.5 data-[side=right]:translate-x-1.5 data-[side=top]:-translate-y-1.5',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn('p-1.5', position === 'popper' && 'w-full min-w-[var(--radix-select-trigger-width)]')}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400', className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-xl py-2 pl-8 pr-3 text-sm font-medium outline-none transition-colors focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-[#131a33] dark:focus:text-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-700', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

function AppSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select option',
  includeEmpty = false,
  emptyLabel = 'Select option',
  disabled = false,
  className,
  showIcon = true,
}) {
  const mappedValue = value === '' || value === null || value === undefined ? EMPTY_VALUE : String(value)

  return (
    <Select
      value={mappedValue}
      onValueChange={(nextValue) => {
        if (!onValueChange) return
        onValueChange(nextValue === EMPTY_VALUE ? '' : nextValue)
      }}
      disabled={disabled}
    >
      <SelectTrigger className={className} showIcon={showIcon}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeEmpty ? <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={`${option.value}-${option.label}`} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  AppSelect,
}
