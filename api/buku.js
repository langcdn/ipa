// api/buku.js
// API Buku Tamu untuk undangan digital pakai Upstash Redis

export default async function handler(req, res) {
  const UPSTASH_URL = "https://immune-civet-10584.upstash.io";
  const AUTH_TOKEN =
    process.env.UPSTASH_AUTH_TOKEN ||
    "Bearer ASlYAAIncDJhMjc4ZDRjYzU4NDM0M2E0OWUwY2Q0N2M3Y2RmZmI2ZnAyMTA1ODQ";

  const pasangan = req.query.pasangan;
  if (!pasangan) {
    return res.status(400).json({ error: "Parameter ?pasangan=nama-pengantin wajib diisi." });
  }

  // ==== CORS ====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ==== Helper: ambil dan simpan data ====
  async function getData() {
    const r = await fetch(`${UPSTASH_URL}/get/buku:${pasangan}`, {
      headers: { Authorization: AUTH_TOKEN },
    });
    const data = await r.json();
    try {
      return data.result ? JSON.parse(data.result) : { tamu: [] };
    } catch {
      return { tamu: [] };
    }
  }

  async function saveData(newData) {
    const r = await fetch(`${UPSTASH_URL}/set/buku:${pasangan}`, {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(newData),
    });
    return await r.json();
  }

  // ==== GET ====
  if (req.method === "GET") {
    try {
      const data = await getData();
      return res.status(200).json(data);
    } catch (err) {
      console.error("❌ GET Error:", err);
      return res.status(500).json({ error: "Gagal mengambil data" });
    }
  }

  // ==== POST ====
  if (req.method === "POST") {
    try {
      // 🔧 Parse body manual biar aman di semua runtime
      let body = "";
      await new Promise((resolve) => {
        req.on("data", (chunk) => (body += chunk));
        req.on("end", resolve);
      });
      const { nama, pesan } = JSON.parse(body || "{}");

      if (!nama || !pesan) {
        return res.status(400).json({ error: "Data tidak lengkap" });
      }

      const data = await getData();
      const newTamu = { nama, pesan, waktu: new Date().toISOString() };
      data.tamu.push(newTamu);
      await saveData(data);

      return res.status(200).json({ success: true, data: newTamu });
    } catch (err) {
      console.error("❌ POST Error:", err);
      return res.status(500).json({ error: "Gagal menyimpan tamu" });
    }
  }

  // ==== DELETE ====
  if (req.method === "DELETE") {
    try {
      let body = "";
      await new Promise((resolve) => {
        req.on("data", (chunk) => (body += chunk));
        req.on("end", resolve);
      });
      const { nama } = JSON.parse(body || "{}");
      if (!nama) return res.status(400).json({ error: "Nama wajib diisi" });

      const data = await getData();
      data.tamu = data.tamu.filter((t) => t.nama !== nama);
      await saveData(data);

      return res.status(200).json({ success: true, deleted: nama });
    } catch (err) {
      console.error("❌ DELETE Error:", err);
      return res.status(500).json({ error: "Gagal menghapus tamu" });
    }
  }

  // ==== Default ====
  return res.status(405).json({ error: "Method tidak diizinkan" });
}
