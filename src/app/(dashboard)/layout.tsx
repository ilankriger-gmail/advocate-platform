'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { OnboardingWrapper } from '@/components/onboarding';
import { useSidebar } from '@/contexts/SidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, close } = useSidebar();

  return (
    <OnboardingWrapper>
      <div className="min-h-screen dashboard-bg">
        {/* Sidebar - visível apenas em desktop */}
        <Sidebar isOpen={isOpen} onClose={close} />

        {/* Main content - safe-area para dispositivos com notch */}
        {/* pb-20 no mobile para espaço da bottom nav, pb-8 no desktop */}
        <main className="md:ml-64 pt-4">
          <div className="px-4 sm:px-6 lg:px-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>

        {/* Bottom navigation - visível apenas em mobile */}
        <BottomNav />
      </div>
    </OnboardingWrapper>
  );
}
