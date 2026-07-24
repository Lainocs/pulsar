export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="max-w-[1180px] mx-auto flex items-center justify-between px-8 py-4.5">
        <div className="flex items-center gap-2.5 font-bold text-[1.25rem] tracking-[0.06em]">
          <span className="logo-mark" /> PULSAR
        </div>
        <nav className="hidden md:flex gap-8 text-[0.88rem]">
          <a href="#now" className="nav-link">
            Now Playing
          </a>
          <a href="#stats" className="nav-link">
            Vue d&apos;ensemble
          </a>
          <a href="#artists" className="nav-link">
            Top Artistes
          </a>
          <a href="#tracks" className="nav-link">
            Top Titres
          </a>
        </nav>
        <div className="status-pill">
          <span className="dot-pulse" /> LIVE
        </div>
      </div>
    </header>
  );
}
