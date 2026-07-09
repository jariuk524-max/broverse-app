import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getSupabase, isSupabasePaused } from "@/lib/supabase";

interface ServiceItem {
  title: string;
  desc: string;
  price: string;
}

interface Service {
  id: string;
  slug: string;
  label: string;
  desc: string;
  price: string;
  image: string;
  heroTitle: string;
  heroAccent: string;
  items: ServiceItem[];
  infoTitle: string;
  infoItems: string[];
  buttonText: string;
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #27272a",
  backgroundColor: "#09090b",
  color: "#fff",
  padding: "12px 16px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#71717a",
  marginBottom: 6,
  display: "block",
};

export default function ServicePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const [showOrder, setShowOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "", description: "" });
  const [orderSending, setOrderSending] = useState(false);
  const [orderResult, setOrderResult] = useState<"ok" | "error" | "paused" | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: Service[]) => {
        const found = data.find((s) => s.slug === slug);
        setService(found || null);
        setLoading(false);
      });
  }, [slug]);

  async function handleCreateOrder() {
    if (!service) return;
    setOrderSending(true);
    setOrderResult(null);

    try {
      const supabase = getSupabase();
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // геолокация недоступна — продолжаем без координат
      }

      const { data: created, error } = await supabase.from("orders").insert({
        service_name: service.label,
        client_name: orderForm.name,
        client_phone: orderForm.phone,
        address: orderForm.address,
        lat: lat,
        lng: lng,
        metadata: orderForm.description ? { description: orderForm.description } : null,
      }).select().single();

      if (error) throw error;

      fetch("/api/telegram-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: created }),
      }).catch(() => {});

      setOrderResult("ok");
      setOrderForm({ name: "", phone: "", address: "", description: "" });
    } catch (err) {
      if (isSupabasePaused(err)) {
        setOrderResult("paused");
      } else {
        console.error("Ошибка создания заказа:", err);
        setOrderResult("error");
      }
    } finally {
      setOrderSending(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#71717a" }}>Загрузка...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 48 }}>404</p>
        <p style={{ color: "#71717a" }}>Услуга не найдена</p>
        <Link href="/" style={{ color: "#34d399", textDecoration: "none" }}>← На главную</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #27272a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none", color: "#fff" }}>
            ← BroVerse
          </Link>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }}>
            {service.label}
          </span>
        </div>
      </header>

      {service.image && (
        <div style={{ width: "100%", height: 320, overflow: "hidden" }}>
          <img src={service.image} alt={service.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: 8 }}>
              Услуга
            </p>
            <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {service.heroTitle}<br />
              <span style={{ color: "#34d399" }}>{service.heroAccent}</span>
            </h1>
          </div>

          {service.items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {service.items.map((item) => (
                <div
                  key={item.title}
                  style={{
                    borderRadius: 24,
                    border: "1px solid #27272a",
                    backgroundColor: "rgba(24,24,27,0.6)",
                    padding: 24,
                  }}
                >
                  <p style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{item.title}</p>
                  <p style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 12 }}>{item.desc}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>{item.price}</p>
                </div>
              ))}
            </div>
          )}

          {service.infoTitle && service.infoItems.length > 0 && (
            <div style={{ borderRadius: 24, border: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)", padding: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>{service.infoTitle}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {service.infoItems.map((text, i) => (
                  <p key={i} style={{ fontSize: 16, color: "#d4d4d8" }}>✓ {text}</p>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowOrder(true)}
            style={{
              borderRadius: 16,
              backgroundColor: "#10b981",
              padding: "16px 32px",
              fontSize: 14,
              fontWeight: 900,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {service.buttonText} →
          </button>
        </div>
      </section>

      {showOrder && (
        <div
          onClick={() => { if (!orderSending) setShowOrder(false); setOrderResult(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
              backgroundColor: "#18181b", borderRadius: "24px 24px 0 0",
              border: "1px solid #27272a", padding: 32, paddingBottom: 48,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900 }}>Новый заказ</h2>
              <button
                type="button"
                onClick={() => { setShowOrder(false); setOrderResult(null); }}
                style={{ background: "none", border: "none", color: "#71717a", fontSize: 24, cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            {orderResult === "ok" && (
              <div style={{ borderRadius: 16, backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid #10b981", padding: 20, marginBottom: 20, textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>✓ Заказ отправлен!</p>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>Мастер увидит заказ и свяжется с вами</p>
              </div>
            )}

            {orderResult === "paused" && (
              <div style={{ borderRadius: 16, backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Проект Supabase приостановлен</p>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>Зайдите в Dashboard Supabase и разархивируйте проект, затем попробуйте снова.</p>
              </div>
            )}

            {orderResult === "error" && (
              <div style={{ borderRadius: 16, backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Ошибка отправки</p>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>Проверьте подключение к интернету и попробуйте снова.</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Ваше имя</label>
                <input
                  type="text" placeholder="Иван"
                  value={orderForm.name}
                  onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Телефон</label>
                <input
                  type="tel" placeholder="+7 (999) 123-45-67"
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Адрес</label>
                <input
                  type="text" placeholder="ул. Примерная, д. 1"
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Описание задачи (необязательно)</label>
                <textarea
                  placeholder="Дополнительные детали..."
                  value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                  rows={3}
                  style={{ ...INPUT_STYLE, resize: "vertical" as const }}
                />
              </div>
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim()}
                style={{
                  borderRadius: 16,
                  backgroundColor: orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim() ? "#27272a" : "#10b981",
                  padding: "16px 32px",
                  fontSize: 14, fontWeight: 900, color: "#fff",
                  border: "none",
                  cursor: orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim() ? "not-allowed" : "pointer",
                }}
              >
                {orderSending ? "Отправка..." : "Отправить заказ →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
