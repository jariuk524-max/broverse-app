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
  const { id } = req.query;
  const services = readServices();
  const index = services.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Service not found" });
  }

  if (req.method === "GET") {
    return res.status(200).json(services[index]);
  }

  if (req.method === "PUT") {
    const body = req.body;
    services[index] = { ...services[index], ...body, id: services[index].id };
    writeServices(services);
    return res.status(200).json(services[index]);
  }

  if (req.method === "DELETE") {
    const removed = services.splice(index, 1);
    writeServices(services);
    return res.status(200).json({ deleted: removed[0] });
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).json({ error: "Method not allowed" });
}
