"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type SavedAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line: string;
  is_default: boolean;
};

/**
 * Saved-address picker. Loads the signed-in customer's addresses, lets them
 * pick one (auto-selecting their default), add a new one, or delete. The
 * chosen address is reported up via `onSelect` so the parent can use it as the
 * order's delivery details.
 */
export function AddressBook({
  onSelect,
  prefill,
}: {
  onSelect: (a: SavedAddress | null) => void;
  prefill?: { recipient?: string; phone?: string };
}) {
  const [supabase] = useState(() => createClient());
  const [list, setList] = useState<SavedAddress[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    label: "",
    recipient: prefill?.recipient ?? "",
    phone: prefill?.phone ?? "",
    line: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(selectId?: string) {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setList([]);
      setLoading(false);
      onSelect(null);
      return;
    }
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as SavedAddress[];
    setList(rows);
    const pick =
      selectId ?? rows.find((r) => r.is_default)?.id ?? rows[0]?.id ?? null;
    setSelId(pick);
    onSelect(rows.find((r) => r.id === pick) ?? null);
    setAdding(rows.length === 0);
    setLoading(false);
  }

  useEffect(() => {
    // Defer so we're not calling setState synchronously in the effect body.
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
    // Run once on mount; load() reports the auto-selected address upward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(a: SavedAddress) {
    setSelId(a.id);
    onSelect(a);
  }

  async function save() {
    if (!form.line.trim()) {
      setError("Please enter the address.");
      return;
    }
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Please sign in.");
      return;
    }
    const { data, error: insErr } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        label: form.label.trim(),
        recipient: form.recipient.trim(),
        phone: form.phone.trim(),
        line: form.line.trim(),
        is_default: list.length === 0,
      })
      .select()
      .single();
    setSaving(false);
    if (insErr || !data) {
      setError(insErr?.message ?? "Could not save the address.");
      return;
    }
    setForm({ label: "", recipient: "", phone: "", line: "" });
    await load((data as SavedAddress).id);
  }

  async function remove(id: string) {
    await supabase.from("addresses").delete().eq("id", id);
    await load(selId === id ? undefined : selId ?? undefined);
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-sea-500" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {list.map((a) => {
        const on = a.id === selId;
        return (
          <div
            key={a.id}
            className={`flex items-start gap-2.5 rounded-xl border p-3 transition ${
              on ? "border-sea-500 bg-sea-50" : "border-hairline bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => choose(a)}
              className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  on ? "border-sea-500 bg-sea-500 text-white" : "border-hairline"
                }`}
              >
                {on && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                  <MapPin className="h-3.5 w-3.5 text-sea-500" />
                  {a.label || a.recipient || "Address"}
                  {a.is_default && (
                    <span className="rounded-full bg-leaf-400/15 px-1.5 py-0.5 text-[9px] font-bold text-leaf-500">
                      Default
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12px] text-ink-soft">
                  {a.line}
                </span>
                {(a.recipient || a.phone) && (
                  <span className="block text-[11px] text-muted">
                    {[a.recipient, a.phone].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => remove(a.id)}
              aria-label="Delete address"
              className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      {adding ? (
        <div className="space-y-2 rounded-xl border border-hairline p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.recipient}
              onChange={(e) =>
                setForm((f) => ({ ...f, recipient: e.target.value }))
              }
              placeholder="Full name"
              className={fieldCls}
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone"
              className={fieldCls}
            />
          </div>
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (Home, Work…) — optional"
            className={fieldCls}
          />
          <textarea
            rows={2}
            value={form.line}
            onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
            placeholder="House no, street, area, city, PIN"
            className={fieldCls}
          />
          {error && (
            <p className="text-[12px] font-semibold text-rose-600">{error}</p>
          )}
          <div className="flex gap-2">
            {list.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-hairline py-2 text-[13px] font-bold text-ink-soft hover:bg-hairline/40"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sea-500 py-2 text-[13px] font-bold text-white disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save address
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-sea-300 py-2.5 text-[13px] font-bold text-sea-600 hover:bg-sea-50/60"
        >
          <Plus className="h-4 w-4" /> Add new address
        </button>
      )}
    </div>
  );
}

const fieldCls =
  "w-full rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200";
