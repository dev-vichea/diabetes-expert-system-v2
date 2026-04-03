import { Sidebar } from './Sidebar'
import { useLanguage } from '@/contexts/LanguageContext'

export function MobileSidebarDrawer({ open, navItems, user, onLogout, onClose }) {
  const { t } = useLanguage()

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transition-transform duration-300 dark:bg-[#030309] lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar
          navItems={navItems}
          userName={user?.name}
          userEmail={user?.email}
          activeRole={user?.roles?.[0] || user?.role || 'user'}
          collapsed={false}
          onLogout={onLogout}
          onClose={onClose}
        />
      </aside>

      {open ? (
        <button
          type="button"
          aria-label={t('common.closeMenu')}
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      ) : null}
    </>
  )
}
