import Link from "next/link";
import { useState, useEffect } from "react";
import { getSupabase, isSupabasePaused } from "@/lib/supabase";

interface ServiceItem {
  title: string;
  desc: string;
  price: string;
}

interface ConfiguratorObject {
  id: string;
  label: string;
  price: number;
}

interface ConfiguratorMaterial {
  id: string;
  label: string;
  multiplier: number;
}

interface Configurator {
  title: string;
  objects: ConfiguratorObject[];
  materials: ConfiguratorMaterial[];
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
  heroDescription?: string;
  items: ServiceItem[];
  configurator?: Configurator;
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

const BTN_STYLE: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #27272a",
  backgroundColor: "#09090b",
  color: "#a1a1aa",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "center",
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN_STYLE,
  border: "1px solid #34d399",
  backgroundColor: "rgba(52,211,153,0.1)",
  color: "#34d399",
};

export default function BroWashPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const [selectedObject, setSelectedObject] = useState<Record<string, string>>({});
  const [selectedMaterial, setSelectedMaterial] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<Record<string, number>>({});

  const [showOrder, setShowOrder] = useState(false);
  const [orderService, setOrderService] = useState<Service | null>(null);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "", description: "" });
  const [orderSending, setOrderSending] = useState(false);
  const [orderResult, setOrderResult] = useState<"ok" | "error" | "paused" | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data: Service[]) => { setServices(data); setLoading(false); });
  }, []);

  function getCalc(service: Service) {
    if (!service.configurator) return 0;
    const obj = service.configurator.objects.find((o) => o.id === (selectedObject[service.id] || ""));
    const mat = service.configurator.materials.find((m) => m.id === (selectedMaterial[service.id] || ""));
    const qty = quantity[service.id] || 1;
    return obj && mat ? Math.round(obj.price * mat.multiplier * qty) : 0;
  }

  function openOrder(service: Service) {
    setOrderService(service);
    setOrderResult(null);
    setOrderForm({ name: "", phone: "", address: "", description: "" });
    setShowOrder(true);
  }

  async function handleCreateOrder() {
    if (!orderService) return;
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
      } catch {}

      const metadata: Record<string, unknown> = {};
      if (orderForm.description) metadata.description = orderForm.description;
      if (orderService.configurator) {
        const obj = orderService.configurator.objects.find((o) => o.id === (selectedObject[orderService.id] || ""));
        const mat = orderService.configurator.materials.find((m) => m.id === (selectedMaterial[orderService.id] || ""));
        const qty = quantity[orderService.id] || 1;
        if (obj) metadata.object = obj.label;
        if (mat) metadata.material = mat.label;
        metadata.quantity = qty;
        metadata.totalPrice = getCalc(orderService);
      }

      const { data: created, error } = await supabase.from("orders").insert({
        service_name: orderService.label,
        client_name: orderForm.name,
        client_phone: orderForm.phone,
        address: orderForm.address,
        lat, lng,
        metadata: Object.keys(metadata).length > 0 ? metadata : null,
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
      if (isSupabasePaused(err)) setOrderResult("paused");
      else { console.error(err); setOrderResult("error"); }
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #27272a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none", color: "#fff" }}>
            ← BroVerse
          </Link>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#34d399" }}>
            BroWash
          </span>
        </div>
      </header>

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: 8 }}>
          Раздел
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Bro<span style={{ color: "#34d399" }}>Wash</span>
        </h1>
        <p style={{ marginTop: 16, fontSize: 16, color: "#a1a1aa", maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
          Профессиональная химчистка мебели на дому и в офисе. Рассчитайте стоимость и закажите выезд мастера.
        </p>
      </section>

      <section style={{ borderTop: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "center", gap: 32, padding: "20px 24px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 13 }}>
            <span>🛡 Trust Score <strong style={{ color: "#fff" }}>100</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 13 }}>
            <span>⭐ Рейтинг <strong style={{ color: "#fff" }}>5.0</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 13 }}>
            <span>⏱ Выезд <strong style={{ color: "#fff" }}>от 1ч</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 13 }}>
            <span>📍 На дому <strong style={{ color: "#34d399" }}>да</strong></span>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
        {services.map((service) => {
          const isExpanded = expandedSlug === service.slug;
          const cfg = service.configurator;
          const total = getCalc(service);
          const objId = selectedObject[service.id] || "";
          const matId = selectedMaterial[service.id] || "";
          const qty = quantity[service.id] || 1;

          return (
            <div
              key={service.id}
              style={{
                borderRadius: 20,
                border: "1px solid #27272a",
                backgroundColor: "rgba(24,24,27,0.6)",
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setExpandedSlug(isExpanded ? null : service.slug)}
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <p style={{ fontSize: 17, fontWeight: 900 }}>{service.label}</p>
                    {cfg && (
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#34d399", backgroundColor: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 6, padding: "2px 8px" }}>
                        Калькулятор
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#a1a1aa" }}>{service.desc}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>{service.price}</p>
                  <p style={{ fontSize: 18, color: "#52525b", marginTop: 2, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>›</p>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: "1px solid #27272a", padding: "20px 24px" }}>
                  {cfg ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={LABEL_STYLE}>Тип мебели</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                          {cfg.objects.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setSelectedObject({ ...selectedObject, [service.id]: o.id })}
                              style={objId === o.id ? BTN_ACTIVE : BTN_STYLE}
                            >
                              {o.label}
                              <br />
                              <span style={{ fontSize: 11, opacity: 0.7 }}>от {o.price} ₽</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={LABEL_STYLE}>Материал обивки</label>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                          {cfg.materials.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedMaterial({ ...selectedMaterial, [service.id]: m.id })}
                              style={matId === m.id ? BTN_ACTIVE : BTN_STYLE}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={LABEL_STYLE}>Количество</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <button
                            type="button"
                            onClick={() => setQuantity({ ...quantity, [service.id]: Math.max(1, qty - 1) })}
                            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", fontSize: 16, cursor: "pointer" }}
                          >
                            –
                          </button>
                          <span style={{ fontSize: 16, fontWeight: 700, minWidth: 28, textAlign: "center" }}>{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity({ ...quantity, [service.id]: qty + 1 })}
                            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", fontSize: 16, cursor: "pointer" }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {total > 0 && (
                        <div style={{ borderTop: "1px solid #27272a", paddingTop: 16, marginTop: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: "#a1a1aa" }}>Итого:</span>
                            <span style={{ fontSize: 22, fontWeight: 900, color: "#34d399" }}>{total.toLocaleString()} ₽</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openOrder(service)}
                            style={{
                              width: "100%", borderRadius: 14,
                              backgroundColor: "#10b981", padding: "14px 24px",
                              fontSize: 14, fontWeight: 900, color: "#fff",
                              border: "none", cursor: "pointer",
                            }}
                          >
                            Заказать →
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {service.items.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
                          {service.items.map((item) => (
                            <div key={item.title} style={{ borderRadius: 14, border: "1px solid #27272a", backgroundColor: "#09090b", padding: 16 }}>
                              <p style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>{item.title}</p>
                              <p style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 8 }}>{item.desc}</p>
                              <p style={{ fontSize: 13, fontWeight: 700, color: "#34d399" }}>{item.price}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {service.infoTitle && service.infoItems.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#a1a1aa", marginBottom: 8 }}>{service.infoTitle}</p>
                          {service.infoItems.map((text, i) => (
                            <p key={i} style={{ fontSize: 13, color: "#71717a", marginBottom: 4 }}>✓ {text}</p>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => openOrder(service)}
                        style={{
                          borderRadius: 14,
                          backgroundColor: "#10b981", padding: "14px 24px",
                          fontSize: 14, fontWeight: 900, color: "#fff",
                          border: "none", cursor: "pointer",
                        }}
                      >
                        {service.buttonText} →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {showOrder && orderService && (
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
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900 }}>Новый заказ</h2>
                <p style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{orderService.label}</p>
              </div>
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
                <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Проект приостановлен</p>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>Свяжитесь с поддержкой.</p>
              </div>
            )}

            {orderResult === "error" && (
              <div style={{ borderRadius: 16, backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>Ошибка отправки</p>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>Проверьте подключение к интернету.</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Ваше имя</label>
                <input type="text" placeholder="Иван" value={orderForm.name}
                  onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Телефон</label>
                <input type="tel" placeholder="+7 (999) 123-45-67" value={orderForm.phone}
                  onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Адрес</label>
                <input type="text" placeholder="ул. Примерная, д. 1" value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Описание задачи</label>
                <textarea placeholder="Дополнительные детали..." value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                  rows={3} style={{ ...INPUT_STYLE, resize: "vertical" as const }} />
              </div>
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim()}
                style={{
                  borderRadius: 16,
                  backgroundColor: orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim() ? "#27272a" : "#10b981",
                  padding: "16px 32px", fontSize: 14, fontWeight: 900, color: "#fff",
                  border: "none", cursor: orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim() ? "not-allowed" : "pointer",
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
