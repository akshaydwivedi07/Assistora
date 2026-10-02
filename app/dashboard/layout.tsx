import Sidebar from "./sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      <Sidebar />

      <main className="lg:pl-64">
        {children}
      </main>

    </div>
  );
}