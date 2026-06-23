import Link from "next/link";
import { FileText } from "lucide-react";
import { Header } from "@/components/Header";
import { HeroBanner } from "@/components/HeroBanner";
import { PopularCategories } from "@/components/PopularCategories";
import { ProductRail } from "@/components/ProductRail";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import {
  getActiveBanners,
  getBestsellers,
  getCategoryTiles,
  getDealsOfTheDay,
  getProductsByCategory,
} from "@/lib/data";

export default async function HomePage() {
  const [banners, tiles, bestsellers, dealsOfTheDay, wellness] =
    await Promise.all([
      getActiveBanners(),
      getCategoryTiles(),
      getBestsellers(),
      getDealsOfTheDay(),
      getProductsByCategory("wellness"),
    ]);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="home" />

      <main className="pb-28 md:pb-16">
        {/* Order with prescription */}
        <section className="px-4 pt-4 md:px-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-sea-100 bg-sea-50/70 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
                <FileText className="h-5 w-5 text-sea-500" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  Order with prescription
                </p>
                <p className="text-[11px] text-muted">
                  Upload your Rx, we&apos;ll do the rest
                </p>
              </div>
            </div>
            <Link
              href="/prescription"
              className="shrink-0 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-black"
            >
              Order now
            </Link>
          </div>
        </section>

        <HeroBanner banners={banners} />

        <PopularCategories tiles={tiles} />

        {bestsellers.length > 0 && (
          <ProductRail title="Bestsellers" products={bestsellers} href="/products" />
        )}
        <ProductRail
          title="Deals of the day"
          products={dealsOfTheDay}
          href="/products"
        />
        {wellness.length > 0 && (
          <ProductRail
            title="Wellness picks"
            products={wellness}
            href="/products?cat=wellness"
          />
        )}

        <Footer />
      </main>

      <BottomNav />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 hidden border-t border-hairline px-6 pb-10 pt-8 md:block">
      <div className="grid grid-cols-4 gap-8">
        <div>
          <Logo variant="brand" />
          <p className="mt-3 max-w-xs text-sm text-muted">
            Wholesale &amp; retail pharmacy. Genuine medicines and wellness
            essentials, delivered to your door.
          </p>
          <p className="mt-3 text-sm font-semibold text-ink">
            Call us: 1800-123-4567
          </p>
        </div>
        <FooterCol
          title="Shop"
          links={["Medicines", "Wellness", "Lab Tests", "Devices"]}
        />
        <FooterCol
          title="Company"
          links={["About us", "Careers", "Blog", "Contact"]}
        />
        <FooterCol
          title="Help"
          links={["FAQs", "Order tracking", "Returns", "Privacy policy"]}
        />
      </div>
      <p className="mt-8 border-t border-hairline pt-5 text-xs text-muted">
        © {new Date().getFullYear()} Pharmaciti Pharmacy. We care for your
        health.
      </p>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-ink">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {links.map((l) => (
          <li key={l}>
            <Link href="/products" className="hover:text-sea-600">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
