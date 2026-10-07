import Link from "next/link";
import { useState, useEffect } from "react";

const CATEGORY_CARDS = [
  { id: "wash", label: "BroWash", desc: "Химчистка", color: "#4285F4", bg: "#EBF3FF" },
  { id: "build", label: "BroBuild", desc: "Ремонт", color: "#EA4335", bg: "#FDECEA" },
  { id: "frame", label: "BroFrame", desc: "Техника", color: "#FBBC05", bg: "#FEF7E0" },
  { id: "move", label: "BroMove", desc: "Переезд", color: "#34A853", bg: "#E8F5E9" },
  { id: "rent", label: "BroRent", desc: "Инструмент", color: "#00BCD4", bg: "#E0F7FA" },
  { id: "care", label: "BroCare", desc: "Обучение", color: "#1C1C1E", bg: "#F5F5F5" },
];

const TRUST_ITEMS = [
  { icon: "🛡", label: "Trust Score 100", desc: "Проверенные мастера" },
  { icon: "⭐", label: "Рейтинг 5.0", desc: "4.9 средний балл" },
  { icon: "⏱", label: "Выезд от 1ч", desc: "Быстрый отклик" },
  { icon: "✅", label: "Гарантия", desc: "На все виды работ" },
];

export default function Home() {
  const [services, setServices] = useState<{ id: string; slug: string; label: string; desc: string; price: string; image: string; domain?: string; brand?: string; color?: string; time?: string }[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices).catch(() => {});
  }, []);

  const filtered = filter === "all" ? services : services.filter((s) => s.domain === filter);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F2F2F7", color: "#1c1c1e", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "14px 20px", backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#1c1c1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>B</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>BroVerse</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/master" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#007AFF", textDecoration: "none" }}>Мастер</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>

        {/* Category Cards */}
        <section style={{ padding: "24px 0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {CATEGORY_CARDS.map((card) => (
              <Link key={card.id} href={`/services/${card.id}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 8px", borderRadius: 20, backgroundColor: card.bg, textDecoration: "none", color: card.color, transition: "transform 0.2s, box-shadow 0.2s" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: card.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                  <span style={{ color: "#fff", fontSize: 16, fontWeight: 900 }}>{card.label[2]}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{card.label}</span>
                <span style={{ fontSize: 9, color: "#8E8E93", marginTop: 2 }}>{card.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust Items */}
        <section style={{ padding: "0 0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1c1c1e" }}>{item.label}</p>
                  <p style={{ fontSize: 9, color: "#8E8E93" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter tabs */}
        <section style={{ padding: "8px 0 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            <button type="button" onClick={() => setFilter("all")} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", backgroundColor: filter === "all" ? "#1c1c1e" : "#E5E5EA", color: filter === "all" ? "#fff" : "#636366" }}>
              Все ({services.length})
            </button>
            {CATEGORY_CARDS.map((cat) => (
              <button key={cat.id} type="button" onClick={() => setFilter(filter === cat.id ? "all" : cat.id)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", backgroundColor: filter === cat.id ? cat.color : cat.bg, color: filter === cat.id ? "#fff" : cat.color }}>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Service Cards */}
        <section style={{ padding: "20px 0 40px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8E8E93", marginBottom: 6 }}>
            {filtered.length} услуг
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {filtered.map((s) => (
              <Link key={s.id} href={`/services/${s.slug}`} style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", padding: 0, textAlign: "left", cursor: "pointer", color: "#1c1c1e", textDecoration: "none", display: "block", overflow: "hidden", boxShadow: "0 1px 12px rgba(0,0,0,0.06)" }}>
                {s.image && (
                  <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", backgroundColor: "#E5E5EA" }}>
                    <img src={s.image} alt={s.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {s.brand && <span style={{ position: "absolute", top: 8, right: 8, padding: "3px 8px", borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", fontSize: 9, fontWeight: 700, color: "#fff" }}>{s.brand}</span>}
                    {s.time && <span style={{ position: "absolute", bottom: 8, left: 8, padding: "3px 8px", borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", fontSize: 9, fontWeight: 700, color: "#fff" }}>{s.time}</span>}
                  </div>
                )}
                <div style={{ padding: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1c1c1e", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</p>
                  <p style={{ fontSize: 10, color: "#8E8E93", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1e" }}>{s.price}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#8E8E93" }}>Заказать →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "0 0 48px" }}>
          <div style={{ borderRadius: 24, backgroundColor: "#1c1c1e", padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Нужна помощь с выбором?</p>
            <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 20 }}>Опишите задачу — подберём мастера за 5 минут</p>
            <button type="button" style={{ borderRadius: 40, backgroundColor: "#fff", color: "#1c1c1e", padding: "14px 32px", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer" }}>
              Оставить заявку →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
