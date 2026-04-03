"use client";

import { SidebarNavItem } from "@/components/shell/sidebar-nav-item";

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 px-3 py-4">
      <nav className="flex flex-col gap-1">
        <SidebarNavItem href="/dashboard" label="Overview" />
        <SidebarNavItem href="/bookings" label="Bookings" />
        <SidebarNavItem href="/manual" label="Manual" />
      </nav>
    </aside>
  );
}
