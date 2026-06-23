"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  PackageX,
  SearchX,
} from "lucide-react";
import { categories, getCategory } from "@/lib/products";
import { formatRupees } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/types";
import type { AdminProduct } from "@/lib/admin/types";
import { genId, useAdmin } from "@/lib/admin/store";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ImageUpload } from "./ImageUpload";
import {
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "./ui";

const TINT_OPTIONS = [
  "#E6F4F1",
  "#E3F0FB",
  "#EAF6EF",
  "#FFF1E6",
  "#FDE9EC",
  "#EEF0FB",
  "#F3ECFB",
  "#FBF4E6",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function blankDraft(): AdminProduct {
  return {
    id: "",
    name: "",
    brand: "",
    category: categories[0].id,
    pack: "",
    price: 0,
    mrp: 0,
    rx: false,
    rating: 4.5,
    description: "",
    highlights: [],
    tint: TINT_OPTIONS[0],
    stock: 0,
    active: true,
  };
}

/* ── Stock badge ──────────────────────────────────────────────────────── */
function StockBadge({ stock }: { stock: number }) {
  const tone =
    stock === 0
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : stock <= LOW_STOCK_THRESHOLD
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${tone}`}
    >
      {stock === 0 ? "Out of stock" : `${stock} in stock`}
    </span>
  );
}

/* ── Product form (inside drawer) ─────────────────────────────────────── */
function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AdminProduct;
  onSave: (p: AdminProduct) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<AdminProduct>(initial);
  const [highlightsText, setHighlightsText] = useState(
    initial.highlights.join("\n"),
  );
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof AdminProduct>(k: K, v: AdminProduct[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  const nameError = touched && !d.name.trim();
  const packError = touched && !d.pack.trim();
  const priceError = touched && (!d.price || d.price <= 0);

  function submit() {
    setTouched(true);
    if (!d.name.trim() || !d.pack.trim() || !d.price || d.price <= 0) return;
    onSave({
      ...d,
      name: d.name.trim(),
      brand: d.brand.trim(),
      pack: d.pack.trim(),
      mrp: d.mrp && d.mrp >= d.price ? d.mrp : d.price,
      highlights: highlightsText
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
    });
  }

  const numClass = "[appearance:textfield]";

  return (
    <>
      <div className="space-y-4">
        <Field label="Product name">
          <TextInput
            value={d.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Dolo 650 Tablet"
            className={nameError ? "border-rose-300 ring-2 ring-rose-100" : ""}
          />
          {nameError && (
            <span className="mt-1 block text-[12px] font-semibold text-rose-600">
              Name is required.
            </span>
          )}
        </Field>

        <Field label="Brand">
          <TextInput
            value={d.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="e.g. Micro Labs"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select
              value={d.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pack / size">
            <TextInput
              value={d.pack}
              onChange={(e) => set("pack", e.target.value)}
              placeholder="e.g. 15 tablets"
              className={packError ? "border-rose-300 ring-2 ring-rose-100" : ""}
            />
            {packError && (
              <span className="mt-1 block text-[12px] font-semibold text-rose-600">
                Required.
              </span>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₹)">
            <TextInput
              type="number"
              inputMode="decimal"
              min={0}
              value={d.price || ""}
              onChange={(e) => set("price", e.target.valueAsNumber || 0)}
              placeholder="0"
              className={`${numClass} ${priceError ? "border-rose-300 ring-2 ring-rose-100" : ""}`}
            />
            {priceError && (
              <span className="mt-1 block text-[12px] font-semibold text-rose-600">
                Enter a price.
              </span>
            )}
          </Field>
          <Field label="MRP (₹)" hint="Used for the strike-through.">
            <TextInput
              type="number"
              inputMode="decimal"
              min={0}
              value={d.mrp || ""}
              onChange={(e) => set("mrp", e.target.valueAsNumber || 0)}
              placeholder="0"
              className={numClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock (units)">
            <TextInput
              type="number"
              inputMode="numeric"
              min={0}
              value={Number.isFinite(d.stock) ? d.stock : ""}
              onChange={(e) =>
                set("stock", Math.max(0, Math.floor(e.target.valueAsNumber || 0)))
              }
              placeholder="0"
              className={numClass}
            />
          </Field>
          <Field label="Rating">
            <TextInput
              type="number"
              inputMode="decimal"
              min={0}
              max={5}
              step={0.1}
              value={d.rating || ""}
              onChange={(e) => set("rating", e.target.valueAsNumber || 0)}
              placeholder="4.5"
              className={numClass}
            />
          </Field>
        </div>

        <div className="flex items-center gap-6 rounded-xl border border-hairline bg-sea-50/30 px-4 py-3">
          <div>
            <span className="mb-1 block text-[13px] font-semibold text-ink">
              Prescription (Rx)
            </span>
            <Toggle checked={d.rx} onChange={(v) => set("rx", v)} />
          </div>
          <div>
            <span className="mb-1 block text-[13px] font-semibold text-ink">
              Visible in store
            </span>
            <Toggle checked={d.active} onChange={(v) => set("active", v)} />
          </div>
        </div>

        <Field
          label="Product photo"
          hint="Shown instead of the icon. Square images look best."
        >
          <ImageUpload
            value={d.imageUrl}
            onChange={(u) => set("imageUrl", u)}
            folder="products"
          />
        </Field>

        <Field label="Tile colour" hint="Background shown when there's no photo.">
          <div className="flex flex-wrap gap-2">
            {TINT_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("tint", t)}
                aria-label={`Colour ${t}`}
                className={`h-9 w-9 rounded-xl border-2 transition ${
                  d.tint === t
                    ? "border-sea-500 ring-2 ring-sea-200"
                    : "border-white"
                }`}
                style={{ backgroundColor: t }}
              />
            ))}
          </div>
        </Field>

        <Field label="Description">
          <TextArea
            rows={3}
            value={d.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Short description shown on the product page."
          />
        </Field>

        <Field label="Highlights" hint="One per line.">
          <TextArea
            rows={3}
            value={highlightsText}
            onChange={(e) => setHighlightsText(e.target.value)}
            placeholder={"Fast relief\nDoctor recommended"}
          />
        </Field>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={submit}>
          {initial.id ? "Save changes" : "Add product"}
        </Button>
      </div>
    </>
  );
}

/* ── Products page ────────────────────────────────────────────────────── */
export function ProductsAdmin() {
  const { data, addProduct, updateProduct, deleteProduct } = useAdmin();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [data.products, query, cat]);

  function openAdd() {
    setEditing(blankDraft());
    setDrawerOpen(true);
  }
  function openEdit(p: AdminProduct) {
    setEditing(p);
    setDrawerOpen(true);
  }
  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  function handleSave(p: AdminProduct) {
    if (p.id) {
      updateProduct(p.id, p);
    } else {
      const existing = new Set(data.products.map((x) => x.id));
      let id = slugify(p.name) || genId("prod");
      if (existing.has(id)) id = `${id}-${genId("p").split("-")[1]}`;
      addProduct({ ...p, id });
    }
    closeDrawer();
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${data.products.length} products in your catalogue`}
        action={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or brand…"
            className="w-full rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
          />
        </div>
        <Select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="sm:w-52"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={query || cat !== "all" ? SearchX : PackageX}
          title="No products found"
          message={
            query || cat !== "all"
              ? "Try a different search or category."
              : "Add your first product to get started."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const category = getCategory(p.category);
            return (
              <div
                key={p.id}
                className={`rounded-2xl border border-hairline bg-white p-3.5 shadow-card transition ${
                  p.active ? "" : "opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl"
                    style={{ backgroundColor: p.tint }}
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      category && (
                        <CategoryIcon
                          iconKey={category.iconKey}
                          className="h-6 w-6 text-ink/65"
                          strokeWidth={1.6}
                        />
                      )
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="line-clamp-1 text-sm font-bold text-ink">
                        {p.name}
                      </h3>
                      {p.rx && (
                        <span className="shrink-0 rounded bg-sea-50 px-1 py-0.5 text-[9px] font-bold text-sea-600">
                          Rx
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted">
                      {category?.name ?? p.category} · {p.pack}
                    </p>
                  </div>
                  <Toggle
                    checked={p.active}
                    onChange={(v) => updateProduct(p.id, { active: v })}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-ink">
                      {formatRupees(p.price)}
                    </span>
                    {p.mrp > p.price && (
                      <span className="text-[12px] text-muted line-through">
                        {formatRupees(p.mrp)}
                      </span>
                    )}
                  </div>
                  <StockBadge stock={p.stock} />
                </div>

                <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline py-2 text-[13px] font-bold text-ink transition hover:bg-sea-50/60"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(p)}
                    aria-label={`Delete ${p.name}`}
                    className="grid w-11 place-items-center rounded-lg border border-hairline text-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing?.id ? "Edit product" : "Add product"}
      >
        {editing && (
          <ProductForm
            initial={editing}
            onSave={handleSave}
            onCancel={closeDrawer}
          />
        )}
      </Drawer>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete product?"
        message={`"${toDelete?.name}" will be removed from your catalogue. This can't be undone.`}
        onConfirm={() => toDelete && deleteProduct(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
