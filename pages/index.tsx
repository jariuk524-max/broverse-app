import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [services, setServices] = useState<{id: string; slug: string; label: string; desc: string; price: string; image: string}[]>([]);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then(setServices);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #27272a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>BroVerse</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/master" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#34d399", textDecoration: "none" }}>
              Мастер
            </Link>
            <Link href="/admin" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", textDecoration: "none" }}>
              Админ
            </Link>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "96px 24px 64px", textAlign: "center" }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Заказ услуг<br />
          <span style={{ color: "#34d399" }}>для вашего дома</span>
        </h1>
        <p style={{ marginTop: 24, fontSize: 18, color: "#a1a1aa", maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
          Профессиональные мастера BroVerse. Выполним любую задачу — от химчистки до сборки мебели.
        </p>
        <button
          type="button"
          onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
          style={{
            marginTop: 40,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 16,
            backgroundColor: "#10b981",
            padding: "16px 32px",
            fontSize: 14,
            fontWeight: 900,
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Выбрать услугу →
        </button>
      </section>

      <section style={{ borderTop: "1px solid #27272a", borderBottom: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "center", gap: 48, padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 14 }}>
            <span>🛡 Trust Score <strong style={{ color: "#fff" }}>100</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 14 }}>
            <span>⭐ Рейтинг <strong style={{ color: "#fff" }}>5.0</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 14 }}>
            <span>⏱ Выезд <strong style={{ color: "#fff" }}>от 1ч</strong></span>
          </div>
        </div>
      </section>

      <section id="services" style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: 8 }}>
          Выберите услугу
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 40 }}>Что вам нужно?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {services.map((s) => (
            <Link
              key={s.id}
              href={`/services/${s.slug}`}
              style={{
                borderRadius: 24,
                border: "1px solid #27272a",
                backgroundColor: "rgba(24,24,27,0.6)",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
                color: "#fff",
                textDecoration: "none",
                display: "block",
                transition: "border-color 0.2s, background-color 0.2s",
                overflow: "hidden",
              }}
            >
              {s.image && (
                <img src={s.image} alt={s.label} style={{ width: "100%", height: 160, objectFit: "cover" }} />
              )}
              <div style={{ padding: 24 }}>
                <p style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 12 }}>{s.desc}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>{s.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
