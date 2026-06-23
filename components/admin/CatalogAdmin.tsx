"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, LayoutGrid, Images } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { AdminCategory, Banner } from "@/lib/admin/types";
import { genId, useAdmin } from "@/lib/admin/store";
import { ImageUpload } from "./ImageUpload";
import {
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  TextArea,
  TextInput,
} from "./ui";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ════════════════════════ CATEGORY FORM ════════════════════════ */
function blankCategory(): AdminCategory {
  return { id: "", name: "", iconKey: "pill", href: "/products" };
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AdminCategory;
  onSave: (c: AdminCategory) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<AdminCategory>(initial);
  const [touched, setTouched] = useState(false);
  const nameError = touched && !d.name.trim();

  function submit() {
    setTouched(true);
    if (!d.name.trim()) return;
    onSave({
      ...d,
      name: d.name.trim(),
      href: d.href.trim() || "/products",
    });
  }

  return (
    <>
      <div className="space-y-4">
        <Field label="Category name">
          <TextInput
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder="e.g. Skin Care"
            className={nameError ? "border-rose-300 ring-2 ring-rose-100" : ""}
          />
          {nameError && (
            <span className="mt-1 block text-[12px] font-semibold text-rose-600">
              Name is required.
            </span>
          )}
        </Field>

        <Field label="Link" hint="Where the tile sends shoppers.">
          <TextInput
            value={d.href}
            onChange={(e) => setD({ ...d, href: e.target.value })}
            placeholder="/products?cat=pharmacy"
          />
        </Field>

        <Field
          label="Category image"
          hint="Fills the whole tile. Falls back to an icon if left empty."
        >
          <ImageUpload
            value={d.imageUrl}
            onChange={(u) => setD({ ...d, imageUrl: u })}
            folder="categories"
          />
        </Field>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={submit}>
          {initial.id ? "Save changes" : "Add category"}
        </Button>
      </div>
    </>
  );
}

/* ════════════════════════ CATEGORIES SECTION ════════════════════════ */
function CategoriesSection() {
  const { data, addCategory, updateCategory, deleteCategory } = useAdmin();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);

  function save(c: AdminCategory) {
    if (c.id) {
      updateCategory(c.id, c);
    } else {
      const existing = new Set(data.categories.map((x) => x.id));
      let id = slugify(c.name) || genId("cat");
      if (existing.has(id)) id = `${id}-${genId("c").split("-")[1]}`;
      addCategory({ ...c, id });
    }
    setOpen(false);
    setEditing(null);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(blankCategory());
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      {data.categories.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No categories"
          message="Add a category tile for the home page."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.categories.map((c) => (
            <div
              key={c.id}
              className="group relative rounded-2xl border border-hairline bg-white p-4 text-center shadow-card"
            >
              <span className="relative mx-auto grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-sea-50 text-sea-600">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <CategoryIcon
                    iconKey={c.iconKey}
                    className="h-7 w-7"
                    strokeWidth={1.6}
                  />
                )}
              </span>
              <p className="mt-2.5 line-clamp-2 text-[13px] font-bold text-ink">
                {c.name}
              </p>
              <div className="mt-3 flex justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(c);
                    setOpen(true);
                  }}
                  aria-label={`Edit ${c.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-hairline text-ink-soft transition hover:bg-sea-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(c)}
                  aria-label={`Delete ${c.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-hairline text-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing?.id ? "Edit category" : "Add category"}
      >
        {editing && (
          <CategoryForm
            initial={editing}
            onSave={save}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete category?"
        message={`"${toDelete?.name}" will be removed from the home page tiles.`}
        onConfirm={() => toDelete && deleteCategory(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

/* ════════════════════════ BANNER FORM ════════════════════════ */
function blankBanner(): Banner {
  return {
    id: "",
    badge: "",
    titleTop: "",
    titleBottom: "",
    subtitle: "",
    ctaLabel: "Shop now",
    ctaHref: "/products",
  };
}

function BannerPreview({ b }: { b: Banner }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sea-600 to-sea-400 p-4">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/25" />
      <span className="relative inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        {b.badge || "Badge"}
      </span>
      <h3 className="relative mt-1.5 text-base font-extrabold leading-tight text-white">
        {b.titleTop || "Title line one"}
        <br />
        {b.titleBottom || "Title line two"}
      </h3>
      <p className="relative mt-1 text-[12px] text-white/85">
        {b.subtitle || "Subtitle text goes here"}
      </p>
      <span className="relative mt-2 inline-block rounded-lg bg-ink px-3 py-1.5 text-[12px] font-bold text-white">
        {b.ctaLabel || "Shop now"}
      </span>
    </div>
  );
}

function BannerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Banner;
  onSave: (b: Banner) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Banner>(initial);
  const [touched, setTouched] = useState(false);
  const titleError = touched && !d.titleTop.trim();
  const set = (k: keyof Banner, v: string) => setD((p) => ({ ...p, [k]: v }));

  function submit() {
    setTouched(true);
    if (!d.titleTop.trim()) return;
    onSave({
      ...d,
      badge: d.badge.trim(),
      titleTop: d.titleTop.trim(),
      titleBottom: d.titleBottom.trim(),
      subtitle: d.subtitle.trim(),
      ctaLabel: d.ctaLabel.trim() || "Shop now",
      ctaHref: d.ctaHref.trim() || "/products",
    });
  }

  return (
    <>
      <div className="mb-4">
        <BannerPreview b={d} />
      </div>
      <div className="space-y-4">
        <Field label="Badge">
          <TextInput
            value={d.badge}
            onChange={(e) => set("badge", e.target.value)}
            placeholder="e.g. Pharmaciti Pharmacy"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title — line 1">
            <TextInput
              value={d.titleTop}
              onChange={(e) => set("titleTop", e.target.value)}
              placeholder="Healthcare,"
              className={
                titleError ? "border-rose-300 ring-2 ring-rose-100" : ""
              }
            />
            {titleError && (
              <span className="mt-1 block text-[12px] font-semibold text-rose-600">
                Required.
              </span>
            )}
          </Field>
          <Field label="Title — line 2">
            <TextInput
              value={d.titleBottom}
              onChange={(e) => set("titleBottom", e.target.value)}
              placeholder="Delivered to You"
            />
          </Field>
        </div>
        <Field label="Subtitle">
          <TextArea
            rows={2}
            value={d.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Up to 25% off on medicines · Free home delivery"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button label">
            <TextInput
              value={d.ctaLabel}
              onChange={(e) => set("ctaLabel", e.target.value)}
              placeholder="Shop now"
            />
          </Field>
          <Field label="Button link">
            <TextInput
              value={d.ctaHref}
              onChange={(e) => set("ctaHref", e.target.value)}
              placeholder="/products"
            />
          </Field>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={submit}>
          {initial.id ? "Save changes" : "Add banner"}
        </Button>
      </div>
    </>
  );
}

/* ════════════════════════ BANNERS SECTION ════════════════════════ */
function BannersSection() {
  const { data, addBanner, updateBanner, deleteBanner } = useAdmin();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Banner | null>(null);

  function save(b: Banner) {
    if (b.id) updateBanner(b.id, b);
    else addBanner({ ...b, id: genId("ban") });
    setOpen(false);
    setEditing(null);
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            setEditing(blankBanner());
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add banner
        </Button>
      </div>

      {data.banners.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No banners"
          message="Add a hero slide for the home page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.banners.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-hairline bg-white p-3 shadow-card"
            >
              <BannerPreview b={b} />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(b);
                    setOpen(true);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline py-2 text-[13px] font-bold text-ink transition hover:bg-sea-50/60"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete(b)}
                  aria-label="Delete banner"
                  className="grid w-11 place-items-center rounded-lg border border-hairline text-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing?.id ? "Edit banner" : "Add banner"}
      >
        {editing && (
          <BannerForm
            initial={editing}
            onSave={save}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete banner?"
        message="This hero slide will be removed from the home page."
        onConfirm={() => toDelete && deleteBanner(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

/* ════════════════════════ PAGE ════════════════════════ */
export function CatalogAdmin() {
  const [tab, setTab] = useState<"categories" | "banners">("categories");

  return (
    <>
      <PageHeader
        title="Categories & Banners"
        subtitle="Manage the home-page category tiles and hero slides."
      />

      <div className="mb-5 inline-flex rounded-xl border border-hairline bg-white p-1">
        {(
          [
            { key: "categories", label: "Categories", icon: LayoutGrid },
            { key: "banners", label: "Banners", icon: Images },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold transition ${
              tab === key
                ? "bg-sea-500 text-white shadow-soft"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "categories" ? <CategoriesSection /> : <BannersSection />}
    </>
  );
}
