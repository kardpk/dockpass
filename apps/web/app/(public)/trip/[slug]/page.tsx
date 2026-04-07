export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-navy px-page pt-4 pb-hero">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-bold text-h3">DockPass</span>
        </div>
        <h1 className="text-display text-white mb-3">Trip: {slug}</h1>
        <p className="text-body text-white/70">Loading trip details...</p>
      </section>
    </main>
  );
}
