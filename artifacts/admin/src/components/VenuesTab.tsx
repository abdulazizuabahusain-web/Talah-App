import { useState } from "react";
import { api, type Venue } from "@/lib/api";

interface Props {
  venues: Venue[];
  onVenuesChange: (venues: Venue[]) => void;
}

const TYPE_LABELS: Record<string, string> = { coffee: "☕ Coffee", dinner: "🌙 Dinner", both: "☕🌙 Both" };

const EMPTY_FORM = { name: "", city: "", area: "", type: "both" as string, googleMapsUrl: "", notes: "" };

export default function VenuesTab({ venues, onVenuesChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState("");
  const [filterType, setFilterType] = useState("");

  const cities = Array.from(new Set(venues.map((v) => v.city))).sort();
  const filtered = venues.filter((v) => {
    if (filterCity && v.city !== filterCity) return false;
    if (filterType && v.type !== filterType) return false;
    return true;
  });

  const startEdit = (v: Venue) => {
    setEditingId(v.id);
    setForm({ name: v.name, city: v.city, area: v.area ?? "", type: v.type, googleMapsUrl: v.googleMapsUrl ?? "", notes: v.notes ?? "" });
    setError(null);
    setShowAdd(false);
  };

  const startAdd = () => {
    setShowAdd(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const handleSave = async (id?: string) => {
    if (!form.name.trim() || !form.city.trim()) { setError("Name and city are required"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim().toLowerCase(),
        area: form.area.trim() || undefined,
        type: form.type,
        googleMapsUrl: form.googleMapsUrl.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (id) {
        const updated = await api.patchVenue(id, payload);
        onVenuesChange(venues.map((v) => (v.id === id ? updated : v)));
        setEditingId(null);
      } else {
        const created = await api.createVenue(payload);
        onVenuesChange([...venues, created]);
        setShowAdd(false);
        setForm(EMPTY_FORM);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (v: Venue) => {
    try {
      if (v.active) {
        await api.deleteVenue(v.id);
        onVenuesChange(venues.map((x) => (x.id === v.id ? { ...x, active: false } : x)));
      } else {
        const updated = await api.patchVenue(v.id, { active: true });
        onVenuesChange(venues.map((x) => (x.id === v.id ? updated : x)));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const FormFields = () => (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Name *", key: "name", placeholder: "Felfel Café" },
        { label: "City *", key: "city", placeholder: "riyadh" },
        { label: "Area", key: "area", placeholder: "Al Olaya" },
        { label: "Google Maps URL", key: "googleMapsUrl", placeholder: "https://maps.google.com/..." },
      ].map(({ label, key, placeholder }) => (
        <div key={key} className={key === "googleMapsUrl" ? "col-span-2" : ""}>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
          <input
            className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={placeholder}
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
      ))}
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
        <select
          className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="both">Both (coffee & dinner)</option>
          <option value="coffee">Coffee only</option>
          <option value="dinner">Dinner only</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
        <input
          className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Optional notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <select
            className="text-sm px-3 py-1.5 rounded-xl border border-input bg-background"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="text-sm px-3 py-1.5 rounded-xl border border-input bg-background"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="coffee">Coffee</option>
            <option value="dinner">Dinner</option>
            <option value="both">Both</option>
          </select>
        </div>
        <button
          onClick={startAdd}
          className="text-sm px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-semibold"
        >
          + Add Venue
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold">New Venue</p>
          <FormFields />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} venue{filtered.length !== 1 ? "s" : ""}</p>

      {/* Venue cards */}
      <div className="space-y-3">
        {filtered.map((v) => (
          <div key={v.id} className={`bg-card border rounded-2xl p-4 space-y-2 ${!v.active ? "opacity-50" : ""}`}>
            {editingId === v.id ? (
              <>
                <FormFields />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(v.id)}
                    disabled={saving}
                    className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.city} · {v.area} · {TYPE_LABELS[v.type] ?? v.type}</p>
                    {v.googleMapsUrl && (
                      <a
                        href={v.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        📍 Maps link
                      </a>
                    )}
                    {v.notes && <p className="text-xs text-muted-foreground mt-0.5">{v.notes}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${v.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {v.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(v)}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(v)}
                    className={`text-xs px-2.5 py-1 rounded-lg border ${v.active ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-primary/40 text-primary hover:bg-primary/10"}`}
                  >
                    {v.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
