"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";
import type { Banner } from "@/lib/products";

/**
 * Auto-sliding hero carousel. Slides come from the DB (admin-editable banners).
 * Decorative artwork + the trust features stay in code since they're presentation
 * only and not part of the editable banner model.
 */
export function HeroBanner({ banners }: { banners: Banner[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const activeRef = { current: 0 };

    const onScroll = () => {
      const elRect = el.getBoundingClientRect();
      const center = elRect.left + elRect.width / 2;
      let nearest = 0;
      let min = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const r = (child as HTMLElement).getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - center);
        if (d < min) {
          min = d;
          nearest = i;
        }
      });
      activeRef.current = nearest;
      setActive(nearest);
    };

    el.addEventListener("scroll", onScroll, { passive: true });

    const id = setInterval(() => {
      const children = Array.from(el.children) as HTMLElement[];
      if (children.length < 2) return;
      const next = (activeRef.current + 1) % children.length;
      el.scrollTo({
        left: children[next].offsetLeft - children[0].offsetLeft,
        behavior: "smooth",
      });
    }, 8000);

    return () => {
      el.removeEventListener("scroll", onScroll);
      clearInterval(id);
    };
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className="pt-3">
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:px-6"
      >
        {banners.map((slide) => (
          <div
            key={slide.id}
            className="relative min-w-full snap-center overflow-hidden rounded-3xl bg-gradient-to-r from-sea-600 to-sea-400 p-4 shadow-card md:p-8"
          >
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/25" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-36 w-36 rounded-full bg-white/15" />

            <div className="relative z-10 max-w-[80%] md:max-w-[62%]">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {slide.badge}
              </span>
              <h2 className="mt-2 text-xl font-extrabold leading-tight text-white md:text-3xl">
                {slide.titleTop}
                <br />
                {slide.titleBottom}
              </h2>
              <p className="mt-1.5 text-[13px] text-white/85 md:text-base">
                {slide.subtitle}
              </p>
              <Link
                href={slide.ctaHref}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black active:scale-[0.98]"
              >
                {slide.ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-semibold text-white/85">
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4" /> Free home delivery
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> 100% genuine
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 flex justify-center gap-1.5">
        {banners.map((b, i) => (
          <span
            key={b.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? "w-5 bg-sea-500" : "w-1.5 bg-sea-200"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
