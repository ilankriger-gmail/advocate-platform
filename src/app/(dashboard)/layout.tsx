'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="lg:ml-64 pt-4">
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
