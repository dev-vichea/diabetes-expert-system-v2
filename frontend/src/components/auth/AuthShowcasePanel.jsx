export function AuthShowcasePanel() {
  return (
    <aside
      className="hidden lg:flex lg:w-1/2 relative min-h-screen overflow-hidden bg-slate-950 items-center justify-center select-none"
      aria-label="Diabetes Expert System Showcase"
    >
      <img
        src="/images/auth-system-showcase.png"
        alt="Diabetes Expert System Clinical Decision Support"
        className="w-full h-full object-cover object-center"
        loading="eager"
      />
    </aside>
  )
}
