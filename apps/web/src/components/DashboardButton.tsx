'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardButton() {
  const pathname = usePathname();

  // Don't show the button if we're already on the dashboard or root
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:bg-primary hover:scale-105 transition-all backdrop-blur-sm border border-primary/20 font-medium text-sm"
    >
      <LayoutDashboard className="w-4 h-4" />
      To Dashboard
    </Link>
  );
}
