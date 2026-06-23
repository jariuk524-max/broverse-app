import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [services, setServices] = useState<{id: string; label: string; desc: string; price: string; image: string}[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ label: "", desc: "", price: "" });
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  async function createService() {
    if (!form.label.trim()) return;
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.label,
        desc: form.desc,
        price: form.price,
        heroTitle: form.label,
        heroAccent: "",
        buttonText: `Заказать ${form.label.toLowerCase()}`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setServices([...services, data]);
      setForm({ label: "", desc: "", price: "" });
      setShowCreate(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Удалить услугу?")) return;
    setDeleting(id);
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices(services.filter((s) => s.id !== id));
    }
    setDeleting(null);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #27272a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none", color: "#fff" }}>
            ← BroVerse
          </Link>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }}>
            Админ-панель
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 900 }}>Услуги ({services.length})</h1>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            style={{
              borderRadius: 12,
              backgroundColor: "#10b981",
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {showCreate ? "Отмена" : "+ Новая услуга"}
          </button>
        </div>

        {showCreate && (
          <div style={{ borderRadius: 16, border: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)", padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Новая услуга</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                placeholder="Название (например: Психолог)"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                style={{ borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none" }}
              />
              <input
                type="text"
                placeholder="Краткое описание"
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                style={{ borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none" }}
              />
              <input
                type="text"
                placeholder="Цена (от 1 000 ₽)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                style={{ borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none" }}
              />
              <button
                type="button"
                onClick={createService}
                disabled={!form.label.trim()}
                style={{
                  borderRadius: 12,
                  backgroundColor: form.label.trim() ? "#10b981" : "#27272a",
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  border: "none",
                  cursor: form.label.trim() ? "pointer" : "not-allowed",
                  alignSelf: "flex-start",
                }}
              >
                Создать
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 16,
                border: "1px solid #27272a",
                backgroundColor: "rgba(24,24,27,0.6)",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {s.image ? (
                    <img src={s.image} alt={s.label} style={{ width: 48, height: 48, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: 48, height: 48, backgroundColor: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      +
                    </div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>{s.label}</p>
                  <p style={{ fontSize: 13, color: "#71717a" }}>{s.desc} · {s.price}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link
                  href={`/admin/edit/${s.id}`}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #27272a",
                    backgroundColor: "transparent",
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  Редактировать
                </Link>
                <button
                  type="button"
                  onClick={() => deleteService(s.id)}
                  disabled={deleting === s.id}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #dc2626",
                    backgroundColor: "transparent",
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#dc2626",
                    cursor: "pointer",
                  }}
                >
                  {deleting === s.id ? "..." : "Удалить"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {services.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#71717a" }}>
            <p style={{ fontSize: 16 }}>Нет услуг. Создайте первую.</p>
          </div>
        )}
      </main>
    </div>
  );
}
