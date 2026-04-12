

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-page py-section">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-large">
          <span className="text-[24px] text-navy">⚓</span>
          <span className="text-[16px] font-semibold text-navy">
            BoatCheckin
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-border rounded-[16px] p-large md:p-[32px] shadow-card">
          {children}
        </div>

        {/* Footer */}
        <p className="text-caption text-grey-text text-center mt-section">
          boatcheckin.com
        </p>
      </div>
    </main>
  );
}
