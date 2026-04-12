export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-page">
      <div className="text-center">
        <p className="text-[48px] mb-4" role="img" aria-label="Anchor">⚓</p>
        <h1 className="text-display text-navy mb-3">BoatCheckin</h1>
        <p className="text-body text-grey-text mb-6">
          Your charter trip, all in one link.
        </p>
        <p className="text-caption text-grey-text">
          by Oakmont Logic LLC
        </p>
      </div>
    </main>
  );
}
