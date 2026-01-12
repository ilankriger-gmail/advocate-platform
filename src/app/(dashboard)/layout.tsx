'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, close } = useSidebar();

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onClose={close} />

      {/* Main content - safe-area para dispositivos com notch */}
      <main className="md:ml-64 pt-4">
        <div className="px-4 sm:px-6 lg:px-8 pb-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </main>
    </div>
  );
}
