import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

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

export default function EditServicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [service, setService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/services/${id}`).then((r) => r.json()).then(setService);
  }, [id]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !service) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setService({ ...service, image: url });
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!service) return;
    setSaving(true);
    const res = await fetch(`/api/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function updateItem(index: number, field: string, value: string) {
    if (!service) return;
    const items = [...service.items];
    items[index] = { ...items[index], [field]: value };
    setService({ ...service, items });
  }

  function addItem() {
    if (!service) return;
    setService({ ...service, items: [...service.items, { title: "", desc: "", price: "" }] });
  }

  function removeItem(index: number) {
    if (!service) return;
    setService({ ...service, items: service.items.filter((_, i) => i !== index) });
  }

  function updateInfoItem(index: number, value: string) {
    if (!service) return;
    const infoItems = [...service.infoItems];
    infoItems[index] = value;
    setService({ ...service, infoItems });
  }

  function addInfoItem() {
    if (!service) return;
    setService({ ...service, infoItems: [...service.infoItems, ""] });
  }

  function removeInfoItem(index: number) {
    if (!service) return;
    setService({ ...service, infoItems: service.infoItems.filter((_, i) => i !== index) });
  }

  if (!service) {
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
          <Link href="/admin" style={{ fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none", color: "#fff" }}>
            ← Назад
          </Link>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }}>
            Редактирование
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>Редактировать: {service.label}</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <section>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: 8, display: "block" }}>
              Главная фотография
            </label>
            {service.image ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img src={service.image} alt={service.label} style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: 16, border: "1px solid #27272a" }} />
                <button
                  type="button"
                  onClick={() => setService({ ...service, image: "" })}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    borderRadius: 8,
                    backgroundColor: "rgba(220,38,38,0.9)",
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Удалить фото
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 240,
                  borderRadius: 16,
                  border: "2px dashed #27272a",
                  cursor: "pointer",
                  color: "#71717a",
                  fontSize: 14,
                }}
              >
                {uploading ? "Загрузка..." : "Нажмите для загрузки фото"}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              </label>
            )}
          </section>

          <section>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: 8, display: "block" }}>
              Название
            </label>
            <input
              type="text"
              value={service.label}
              onChange={(e) => setService({ ...service, label: e.target.value })}
              style={{ width: "100%", borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </section>

          <section>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: 8, display: "block" }}>
              Краткое описание (на главной)
            </label>
            <input
              type="text"
              value={service.desc}
              onChange={(e) => setService({ ...service, desc: e.target.value })}
              style={{ width: "100%", borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </section>

          <section>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: 8, display: "block" }}>
              Цена на главной
            </label>
            <input
              type="text"
              value={service.price}
              onChange={(e) => setService({ ...service, price: e.target.value })}
              style={{ width: "100%", borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </section>

          <section>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: 8, display: "block" }}>
              Заголовок на странице услуги
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={service.heroTitle}
                onChange={(e) => setService({ ...service, heroTitle: e.target.value })}
                placeholder="Основной"
                style={{ flex: 1, borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none" }}
              />
              <input
                type="text"
                value={service.heroAccent}
                onChange={(e) => setService({ ...service, heroAccent: e.target.value })}
                placeholder="Акцент (зелёный)"
                style={{ flex: 1, borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none" }}
              />
            </div>
          </section>

          <section>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a", marginBottom: 8, display: "block" }}>
              Текст кнопки
            </label>
            <input
              type="text"
              value={service.buttonText}
              onChange={(e) => setService({ ...service, buttonText: e.target.value })}
              style={{ width: "100%", borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </section>

          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a" }}>
                Подуслуги
              </label>
              <button
                type="button"
                onClick={addItem}
                style={{
                  borderRadius: 8,
                  border: "1px solid #27272a",
                  backgroundColor: "transparent",
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#10b981",
                  cursor: "pointer",
                }}
              >
                + Добавить
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {service.items.map((item, i) => (
                <div key={i} style={{ borderRadius: 12, border: "1px solid #27272a", backgroundColor: "rgba(24,24,27,0.6)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(i, "title", e.target.value)}
                      placeholder="Название"
                      style={{ flex: 1, borderRadius: 8, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "8px 12px", fontSize: 13, outline: "none" }}
                    />
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) => updateItem(i, "price", e.target.value)}
                      placeholder="Цена"
                      style={{ width: 140, borderRadius: 8, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "8px 12px", fontSize: 13, outline: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      style={{
                        borderRadius: 8,
                        border: "1px solid #dc2626",
                        backgroundColor: "transparent",
                        padding: "8px 10px",
                        fontSize: 12,
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) => updateItem(i, "desc", e.target.value)}
                    placeholder="Описание"
                    style={{ width: "100%", borderRadius: 8, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#71717a" }}>
                Информационный блок
              </label>
              <button
                type="button"
                onClick={addInfoItem}
                style={{
                  borderRadius: 8,
                  border: "1px solid #27272a",
                  backgroundColor: "transparent",
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#10b981",
                  cursor: "pointer",
                }}
              >
                + Добавить
              </button>
            </div>
            <input
              type="text"
              value={service.infoTitle}
              onChange={(e) => setService({ ...service, infoTitle: e.target.value })}
              placeholder="Заголовок блока"
              style={{ width: "100%", borderRadius: 12, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "12px 16px", fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {service.infoItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateInfoItem(i, e.target.value)}
                    placeholder={`Пункт ${i + 1}`}
                    style={{ flex: 1, borderRadius: 8, border: "1px solid #27272a", backgroundColor: "#09090b", color: "#fff", padding: "8px 12px", fontSize: 13, outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeInfoItem(i)}
                    style={{
                      borderRadius: 8,
                      border: "1px solid #dc2626",
                      backgroundColor: "transparent",
                      padding: "8px 10px",
                      fontSize: 12,
                      color: "#dc2626",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display: "flex", gap: 12, paddingTop: 16 }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                borderRadius: 12,
                backgroundColor: "#10b981",
                padding: "12px 32px",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              {saving ? "Сохранение..." : saved ? "Сохранено ✓" : "Сохранить"}
            </button>
            <Link
              href={`/services/${service.slug}`}
              style={{
                borderRadius: 12,
                border: "1px solid #27272a",
                backgroundColor: "transparent",
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                textDecoration: "none",
              }}
            >
              Посмотреть →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
