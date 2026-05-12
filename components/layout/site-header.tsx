import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold tracking-wide text-gold">ORDA</Link>
        <nav className="flex items-center gap-5 text-sm text-white/80">
          <Link href="/auth/signup" className="rounded-full bg-[linear-gradient(145deg,#f8fafc_0%,#e2e8f0_25%,#cbd5e1_50%,#94a3b8_75%,#475569_100%)]gold px-4 py-2 font-semibold text-black">Get started</Link>
          <Link href="/auth/login">Log in</Link>
        </nav>
      </div>
    </header>
  );
}
