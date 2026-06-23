"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Menu,
  X,
  Store,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAdmin } from "@/lib/admin/store";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/catalog", label: "Categories & Banners", icon: LayoutGrid },
];

function matchPath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = matchPath(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-sea-50 text-sea-600"
                : "text-ink-soft hover:bg-hairline/60 hover:text-ink"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onAction }: { onAction?: () => void }) {
  const { signOut } = useAdmin();
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-hairline pt-3">
      <Link
        href="/"
        onClick={onAction}
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-hairline/60 hover:text-ink"
      >
        <Store className="h-[18px] w-[18px]" strokeWidth={2.1} />
        View store
      </Link>
      <button
        type="button"
        onClick={() => {
          onAction?.();
          signOut();
        }}
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={2.1} />
        Sign out
      </button>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!mobileOpen) {
      // Defer the reset so it isn't a synchronous setState in the effect body.
      const t = setTimeout(() => setShow(false), 0);
      return () => clearTimeout(t);
    }
    const raf = requestAnimationFrame(() => setShow(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-hairline bg-white px-4 py-5 md:flex">
        <Link href="/admin" className="mb-6 px-1.5">
          <Logo variant="brand" />
        </Link>
        <NavLinks />
        <SidebarFooter />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-hairline bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-xl border border-hairline text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/admin">
          <Logo variant="brand" />
        </Link>
        <span className="ml-auto rounded-full bg-sea-50 px-2.5 py-1 text-[11px] font-bold text-sea-600">
          Admin
        </span>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className={`absolute inset-0 bg-ink/40 backdrop-blur-[1px] transition-opacity duration-200 ${
              show ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={`absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white px-4 py-5 shadow-2xl transition-transform duration-300 ease-out ${
              show ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-6 flex items-center justify-between px-1.5">
              <Logo variant="brand" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-hairline/60 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter onAction={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
