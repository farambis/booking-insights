"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarNavItemProps {
  href: string;
  label: string;
}

export function SidebarNavItem({ href, label }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex h-9 items-center rounded-md px-3 text-base font-medium transition-colors ${
        isActive
          ? "border-brand bg-brand-tint text-brand border-l-[3px]"
          : "text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      {label}
    </Link>
  );
}
