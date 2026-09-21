export default function DiscoverPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--sand-bg)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🧭</div>
        <h1 className="text-4xl font-black mb-3"
          style={{ fontFamily: 'Playfair Display, serif', color: 'var(--forest-green)' }}>
          Discover
        </h1>
        <p className="text-lg mb-2" style={{ color: 'var(--sage-green)' }}>
          Coming soon
        </p>
        <p className="text-sm" style={{ color: 'var(--sage-green)' }}>
          Explore curated destinations, hidden gems, and travel inspiration — all in one place.
        </p>
      </div>
    </main>
  )
}
