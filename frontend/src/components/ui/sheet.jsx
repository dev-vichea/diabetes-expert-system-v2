import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// shadcn-style Sheet (side drawer) built on Radix Dialog.
// Renders through a portal to <body>, so it always covers the viewport even
// when used inside transformed/animated page wrappers (e.g. .page-open-motion)
// that would otherwise become the containing block for position:fixed.

const Sheet = (props) => <DialogPrimitive.Root {...props} />
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const overlayVariants = cva(
  'fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px] transition-opacity',
  {
    variants: {
      motion: {
        animate:
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        none: '',
      },
    },
    defaultVariants: { motion: 'animate' },
  },
)

const sheetVariants = cva(
  'fixed z-50 flex flex-col border-slate-200 bg-white shadow-2xl outline-none transition dark:border-[#1f2640] dark:bg-[#070712]',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-full w-full border-l data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-200 sm:max-w-xl',
        left: 'inset-y-0 left-0 h-full w-full border-r data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=closed]:duration-200 sm:max-w-xl',
        top: 'inset-x-0 top-0 border-b data-[state=open]:animate-in data-[state=open]:slide-in-from-top data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:duration-200',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:duration-200',
      },
      motion: {
        animate: '',
        none: '',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

function SheetOverlay({ className, motion, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(overlayVariants({ motion }), className)}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  motion = 'animate',
  showClose = true,
  ...props
}) {
  const overlayMotion = motion === 'none' ? 'none' : 'animate'
  const contentMotion =
    motion === 'none'
      ? ''
      : 'data-[state=open]:animate-in data-[state=closed]:animate-out'

  return (
    <SheetPortal>
      <SheetOverlay motion={overlayMotion} />
      <DialogPrimitive.Content
        className={cn(sheetVariants({ side }), contentMotion, className)}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 border-b border-slate-200 p-5 pr-16 dark:border-[#1f2640]',
        className,
      )}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }) {
  return (
    <div
      className={cn('min-h-0 flex-1 overflow-y-auto p-5', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        'mt-auto flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:justify-end dark:border-[#1f2640] dark:bg-[#0c1324]',
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'text-base font-semibold text-slate-900 dark:text-slate-100',
        className,
      )}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-slate-600 dark:text-slate-300', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
