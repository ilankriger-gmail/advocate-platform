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

      {/* Main content */}
      <main className="md:ml-64 pt-4">
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
