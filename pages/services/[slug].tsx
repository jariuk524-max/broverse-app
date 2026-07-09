import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { getSupabase, isSupabasePaused } from "@/lib/supabase";

interface ServiceItem {
  title: string;
  desc: string;
  price: string;
}

interface QuizOption {
  id: string;
  label: string;
  basePrice?: number;
  multiplier?: number;
  surcharge?: number;
}

interface QuizStep {
  question: string;
  options: QuizOption[];
}

interface Quiz {
  title: string;
  subtitle: string;
  steps: QuizStep[];
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
  quiz?: Quiz;
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

export default function ServicePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizOption[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  const [selectedObject, setSelectedObject] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const [showOrder, setShowOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "", description: "" });
  const [orderSending, setOrderSending] = useState(false);
  const [orderResult, setOrderResult] = useState<"ok" | "error" | "paused" | null>(null);

  const cfgObj = service?.configurator?.objects.find((o) => o.id === selectedObject);
  const cfgMat = service?.configurator?.materials.find((m) => m.id === selectedMaterial);
  const cfgTotal = cfgObj && cfgMat ? Math.round(cfgObj.price * cfgMat.multiplier * quantity) : 0;

  function calcQuizPrice(): number {
    if (!service?.quiz) return 0;
    let base = 0;
    let multiplier = 1;
    let surcharge = 0;
    for (const ans of quizAnswers) {
      if (ans.basePrice) base = ans.basePrice;
      if (ans.multiplier) multiplier = ans.multiplier;
      if (ans.surcharge) surcharge += ans.surcharge;
    }
    return base > 0 ? Math.round(base * multiplier + surcharge) : 0;
  }

  const quizTotal = calcQuizPrice();

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

  function handleQuizAnswer(option: QuizOption) {
    const newAnswers = [...quizAnswers];
    newAnswers[quizStep] = option;
    setQuizAnswers(newAnswers);

    if (service?.quiz && quizStep < service.quiz.steps.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizDone(true);
    }
  }

  function handleQuizBack() {
    if (quizStep > 0) setQuizStep(quizStep - 1);
  }

  function handleQuizRestart() {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizDone(false);
  }

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
      } catch {}

      const metadata: Record<string, unknown> = {};
      if (orderForm.description) metadata.description = orderForm.description;

      if (service.quiz && quizDone) {
        metadata.quiz = quizAnswers.map((a) => a.label);
        metadata.totalPrice = quizTotal;
      }
      if (service.configurator && cfgObj) {
        metadata.object = cfgObj.label;
        if (cfgMat) metadata.material = cfgMat.label;
        metadata.quantity = quantity;
        metadata.totalPrice = cfgTotal;
      }

      const { data: created, error } = await supabase.from("orders").insert({
        service_name: service.label,
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

  if (!service) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#18181b", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 48 }}>404</p>
        <p style={{ color: "#71717a" }}>Услуга не найдена</p>
        <Link href="/" style={{ color: "#34d399", textDecoration: "none" }}>← На главную</Link>
      </div>
    );
  }

  const hasQuiz = !!service.quiz;
  const hasCfg = !!service.configurator;
  const total = hasQuiz ? quizTotal : cfgTotal;

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
            {service.heroDescription && (
              <p style={{ marginTop: 24, fontSize: 16, color: "#a1a1aa", maxWidth: 640, lineHeight: 1.6 }}>
                {service.heroDescription}
              </p>
            )}
          </div>

          {hasQuiz && service.quiz && (
            <div style={{ borderRadius: 24, border: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)", padding: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{service.quiz.title}</h2>
              {!quizDone && <p style={{ fontSize: 13, color: "#71717a", marginBottom: 24 }}>{service.quiz.subtitle}</p>}

              {!quizDone && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                    {service.quiz.steps.map((_, i) => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        backgroundColor: i <= quizStep ? "#34d399" : "#27272a",
                        transition: "background-color 0.3s",
                      }} />
                    ))}
                  </div>

                  <p style={{ fontSize: 14, color: "#71717a", marginBottom: 8 }}>
                    Шаг {quizStep + 1} из {service.quiz.steps.length}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>
                    {service.quiz.steps[quizStep].question}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {service.quiz.steps[quizStep].options.map((opt) => {
                      const isSelected = quizAnswers[quizStep]?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleQuizAnswer(opt)}
                          style={{
                            borderRadius: 14,
                            border: `1px solid ${isSelected ? "#34d399" : "#27272a"}`,
                            backgroundColor: isSelected ? "rgba(52,211,153,0.1)" : "#09090b",
                            color: isSelected ? "#34d399" : "#d4d4d8",
                            padding: "14px 20px",
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s",
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {quizStep > 0 && (
                    <button
                      type="button"
                      onClick={handleQuizBack}
                      style={{
                        marginTop: 12, background: "none", border: "none",
                        color: "#71717a", fontSize: 13, cursor: "pointer",
                      }}
                    >
                      ← Назад
                    </button>
                  )}
                </div>
              )}

              {quizDone && (
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {quizAnswers.map((ans, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #27272a" }}>
                        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{service.quiz!.steps[i].question}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{ans.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid #27272a", paddingTop: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <span style={{ fontSize: 14, color: "#a1a1aa" }}>Расчётная стоимость:</span>
                      <span style={{ fontSize: 28, fontWeight: 900, color: "#34d399" }}>{quizTotal.toLocaleString()} ₽</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#71717a", marginBottom: 16 }}>
                      * Точная стоимость будет подтверждена после осмотра мастером
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowOrder(true)}
                      style={{
                        width: "100%", borderRadius: 16,
                        backgroundColor: "#10b981", padding: "16px 32px",
                        fontSize: 15, fontWeight: 900, color: "#fff",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      Оформить заявку →
                    </button>
                    <button
                      type="button"
                      onClick={handleQuizRestart}
                      style={{
                        marginTop: 10, width: "100%", borderRadius: 16,
                        backgroundColor: "transparent", border: "1px solid #27272a",
                        padding: "12px 32px", fontSize: 13, fontWeight: 700,
                        color: "#71717a", cursor: "pointer",
                      }}
                    >
                      Пройти заново
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasCfg && (
            <div style={{ borderRadius: 24, border: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)", padding: 32 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 24 }}>{service.configurator!.title}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={LABEL_STYLE}>Тип мебели</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                    {service.configurator!.objects.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedObject(o.id)}
                        style={{
                          borderRadius: 12,
                          border: `1px solid ${selectedObject === o.id ? "#34d399" : "#27272a"}`,
                          backgroundColor: selectedObject === o.id ? "rgba(52,211,153,0.1)" : "#09090b",
                          color: selectedObject === o.id ? "#34d399" : "#a1a1aa",
                          padding: "12px 16px", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", textAlign: "center",
                        }}
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                    {service.configurator!.materials.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMaterial(m.id)}
                        style={{
                          borderRadius: 12,
                          border: `1px solid ${selectedMaterial === m.id ? "#34d399" : "#27272a"}`,
                          backgroundColor: selectedMaterial === m.id ? "rgba(52,211,153,0.1)" : "#09090b",
                          color: selectedMaterial === m.id ? "#34d399" : "#a1a1aa",
                          padding: "12px 16px", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", textAlign: "center",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Количество</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", fontSize: 18, cursor: "pointer" }}>–</button>
                    <span style={{ fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: "center" }}>{quantity}</span>
                    <button type="button" onClick={() => setQuantity(quantity + 1)}
                      style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", fontSize: 18, cursor: "pointer" }}>+</button>
                  </div>
                </div>
                {cfgTotal > 0 && (
                  <div style={{ borderTop: "1px solid #27272a", paddingTop: 16, marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: "#a1a1aa" }}>Итого:</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: "#34d399" }}>{cfgTotal.toLocaleString()} ₽</span>
                    </div>
                    <button type="button" onClick={() => setShowOrder(true)}
                      style={{ marginTop: 16, width: "100%", borderRadius: 16, backgroundColor: "#10b981", padding: "16px 32px", fontSize: 14, fontWeight: 900, color: "#fff", border: "none", cursor: "pointer" }}>
                      Заказать →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {service.items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {service.items.map((item) => (
                <div key={item.title} style={{ borderRadius: 24, border: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)", padding: 24 }}>
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

          {!hasQuiz && !hasCfg && (
            <button type="button" onClick={() => setShowOrder(true)}
              style={{ borderRadius: 16, backgroundColor: "#10b981", padding: "16px 32px", fontSize: 14, fontWeight: 900, color: "#fff", border: "none", cursor: "pointer", alignSelf: "flex-start" }}>
              {service.buttonText} →
            </button>
          )}
        </div>
      </section>

      {showOrder && (
        <div
          onClick={() => { if (!orderSending) setShowOrder(false); setOrderResult(null); }}
          style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", backgroundColor: "#18181b", borderRadius: "24px 24px 0 0", border: "1px solid #27272a", padding: 32, paddingBottom: 48 }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>Оформить заявку</h2>
                {total > 0 && <p style={{ fontSize: 16, fontWeight: 700, color: "#34d399", marginTop: 4 }}>≈ {total.toLocaleString()} ₽</p>}
              </div>
              <button type="button" onClick={() => { setShowOrder(false); setOrderResult(null); }}
                style={{ background: "none", border: "none", color: "#71717a", fontSize: 24, cursor: "pointer" }}>×</button>
            </div>

            {orderResult === "ok" && (
              <div style={{ borderRadius: 16, backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid #10b981", padding: 20, marginBottom: 20, textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#10b981", marginBottom: 4 }}>✓ Заявка отправлена!</p>
                <p style={{ fontSize: 13, color: "#a1a1aa" }}>Менеджер свяжется с вами в ближайшее время</p>
              </div>
            )}
            {orderResult === "paused" && (
              <div style={{ borderRadius: 16, backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>Проект приостановлен</p>
              </div>
            )}
            {orderResult === "error" && (
              <div style={{ borderRadius: 16, backgroundColor: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", padding: 20, marginBottom: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>Ошибка. Проверьте подключение.</p>
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
                <label style={LABEL_STYLE}>Комментарий</label>
                <textarea placeholder="Дополнительные детали..." value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                  rows={3} style={{ ...INPUT_STYLE, resize: "vertical" as const }} />
              </div>
              <button type="button" onClick={handleCreateOrder}
                disabled={orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim()}
                style={{
                  borderRadius: 16,
                  backgroundColor: orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim() ? "#27272a" : "#10b981",
                  padding: "16px 32px", fontSize: 14, fontWeight: 900, color: "#fff", border: "none",
                  cursor: orderSending || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim() ? "not-allowed" : "pointer",
                }}>
                {orderSending ? "Отправка..." : "Отправить заявку →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
