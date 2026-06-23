import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "services.json");

function readServices() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeServices(services) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(services, null, 2));
}

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json(readServices());
  }

  if (req.method === "POST") {
    const services = readServices();
    const body = req.body;
    const id = body.slug || body.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (services.find((s) => s.id === id)) {
      return res.status(400).json({ error: "Service with this ID already exists" });
    }

    const newService = {
      id,
      slug: id,
      label: body.label || "Новая услуга",
      desc: body.desc || "",
      price: body.price || "от 0 ₽",
      image: body.image || "",
      heroTitle: body.heroTitle || body.label || "Новая услуга",
      heroAccent: body.heroAccent || "",
      items: body.items || [],
      infoTitle: body.infoTitle || "",
      infoItems: body.infoItems || [],
      buttonText: body.buttonText || "Заказать",
    };

    services.push(newService);
    writeServices(services);
    return res.status(201).json(newService);
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
}
