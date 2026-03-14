import * as React from 'react'
import { cn } from '@/lib/utils'

const Sidebar = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar" className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden', className)} {...props} />
))
Sidebar.displayName = 'Sidebar'

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-header" className={cn('p-3', className)} {...props} />
))
SidebarHeader.displayName = 'SidebarHeader'

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-content" className={cn('custom-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3', className)} {...props} />
))
SidebarContent.displayName = 'SidebarContent'

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-footer" className={cn('shrink-0 p-3', className)} {...props} />
))
SidebarFooter.displayName = 'SidebarFooter'

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <section ref={ref} data-slot="sidebar-group" className={cn('space-y-1', className)} {...props} />
))
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="sidebar-group-label"
    className={cn('px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500/90', className)}
    {...props}
  />
))
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul ref={ref} data-slot="sidebar-menu" className={cn('flex flex-col gap-1', className)} {...props} />
))
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} data-slot="sidebar-menu-item" className={cn('group/menu-item', className)} {...props} />
))
SidebarMenuItem.displayName = 'SidebarMenuItem'

const SidebarMenuButton = React.forwardRef(({ className, asChild = false, children, ...props }, ref) => {
  const baseClassName = cn(
    'flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#070a1a] dark:hover:text-slate-200',
    className
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(baseClassName, children.props.className),
    })
  }

  return (
    <button ref={ref} data-slot="sidebar-menu-button" className={baseClassName} {...props}>
      {children}
    </button>
  )
})
SidebarMenuButton.displayName = 'SidebarMenuButton'

const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="sidebar-separator" className={cn('mx-2 my-2 h-px bg-slate-200 dark:bg-[#1a2037]', className)} {...props} />
))
SidebarSeparator.displayName = 'SidebarSeparator'

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
}
