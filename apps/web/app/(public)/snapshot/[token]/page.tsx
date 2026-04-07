export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-off-white px-page py-section">
      <h1 className="text-h1 text-dark-text mb-4">Captain Snapshot</h1>
      <p className="text-body text-grey-text">
        Read-only guest list view. Token: {token.slice(0, 8)}...
      </p>
    </main>
  );
}
