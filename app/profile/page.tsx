import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  Heart,
  Headphones,
  ChevronRight,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SignOutButton } from "@/components/SignOutButton";
import { getProfile } from "@/lib/auth";

const ROWS = [
  { icon: Package, label: "My Orders", desc: "Track & reorder", href: "/orders" },
  { icon: MapPin, label: "Saved Addresses", desc: "Home, Office & more", href: "/profile" },
  { icon: Heart, label: "Wishlist", desc: "Items you love", href: "/profile" },
  { icon: Headphones, label: "Help & Support", desc: "We're here to help", href: "/profile" },
];

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="inner" title="Profile" />

      <main className="px-4 pb-36 pt-4 md:px-6 md:pb-16">
        {/* Account card */}
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-4 shadow-card">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sea-50">
            <User className="h-7 w-7 text-sea-500" />
          </span>
          <div className="flex-1">
            <p className="text-base font-bold text-ink">
              {profile?.full_name?.trim() || (profile ? "Your account" : "Guest User")}
            </p>
            <p className="text-[12px] text-muted">
              {profile?.phone || (profile ? "Signed in" : "Sign in to sync your orders")}
            </p>
          </div>
          {!profile && (
            <Link
              href="/login?next=/profile"
              className="rounded-xl bg-sea-500 px-4 py-2 text-xs font-bold text-white shadow-soft"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Rows */}
        <div className="mt-4 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          {ROWS.map(({ icon: Icon, label, desc, href }) => (
            <Link
              key={label}
              href={href}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-sea-50/40"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sea-50">
                <Icon className="h-4 w-4 text-sea-600" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {label}
                </span>
                <span className="block text-[11px] text-muted">{desc}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>

        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-sea-200 bg-sea-50/60 py-3 text-sm font-bold text-sea-600 transition hover:bg-sea-50"
          >
            <ShieldCheck className="h-4 w-4" />
            Go to Admin panel
          </Link>
        )}

        <Link
          href="/cart"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-hairline bg-white py-3 text-sm font-bold text-ink shadow-card transition hover:bg-sea-50/40"
        >
          <ShoppingBag className="h-4 w-4 text-sea-500" />
          View your cart
        </Link>

        {profile && <SignOutButton />}
      </main>

      <BottomNav />
    </div>
  );
}
