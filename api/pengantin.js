// api/pengantin.js
export default async function handler(req, res) {
  const UPSTASH_URL = "https://immune-civet-10584.upstash.io";
  const AUTH_TOKEN =
    process.env.UPSTASH_AUTH_TOKEN ||
    "Bearer ASlYAAIncDJhMjc4ZDRjYzU4NDM0M2E0OWUwY2Q0N2M3Y2RmZmI2ZnAyMTA1ODQ";

  // ==== CORS ====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ===== Fungsi bantu =====
  async function getData() {
    const r = await fetch(`${UPSTASH_URL}/get/pengantin`, {
      headers: { Authorization: AUTH_TOKEN },
    });
    const data = await r.json();
    try {
      return data.result ? JSON.parse(data.result) : [];
    } catch {
      return [];
    }
  }

  async function saveData(newData) {
    await fetch(`${UPSTASH_URL}/set/pengantin`, {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(newData),
    });
  }

  // ==== GET Data Pengantin per filter ====
  if (req.method === "GET") {
    try {
      const data = await getData();
      const { id, namaPasangan, email } = req.query;

      if (id) {
        const found = data.find((p) => p.id === id);
        if (!found) return res.status(404).json({ error: "Data pengantin tidak ditemukan" });
        return res.status(200).json(found);
      }

      if (namaPasangan) {
        const found = data.find((p) => p.namaPasangan.toLowerCase() === namaPasangan.toLowerCase());
        if (!found) return res.status(404).json({ error: "Data pengantin tidak ditemukan" });
        return res.status(200).json(found);
      }

      if (email) {
        const found = data.find((p) => p.email.toLowerCase() === email.toLowerCase());
        if (!found) return res.status(404).json({ error: "Data pengantin tidak ditemukan" });
        return res.status(200).json(found);
      }

      // Tidak ada filter → kosongkan
      return res.status(200).json([]);
    } catch (err) {
      console.error("❌ GET Error:", err);
      return res.status(500).json({ error: "Gagal mengambil data pengantin" });
    }
  }

  // ==== POST Tambah pengantin baru ====
  if (req.method === "POST") {
    try {
      let body = "";
      await new Promise((resolve) => {
        req.on("data", (chunk) => (body += chunk));
        req.on("end", resolve);
      });
      const { id, namaPasangan, temaUndangan, paketUndangan, masaAktif, foto, email, sandi } = JSON.parse(body || "{}");

      if (!id || !namaPasangan || !temaUndangan || !paketUndangan || !masaAktif || !foto || !email || !sandi) {
        return res.status(400).json({ error: "Data pengantin tidak lengkap" });
      }

      const data = await getData();
      data.push({ id, namaPasangan, temaUndangan, paketUndangan, masaAktif, foto, email, sandi });
      await saveData(data);

      return res.status(200).json({ success: true, data: { id, namaPasangan, email } });
    } catch (err) {
      console.error("❌ POST Error:", err);
      return res.status(500).json({ error: "Gagal menyimpan data pengantin" });
    }
  }

  // ==== PUT Update pengantin ====
  if (req.method === "PUT") {
    try {
      let body = "";
      await new Promise((resolve) => {
        req.on("data", (chunk) => (body += chunk));
        req.on("end", resolve);
      });
      const { id, ...updateData } = JSON.parse(body || "{}");
      if (!id) return res.status(400).json({ error: "ID pengantin wajib diisi" });

      const data = await getData();
      const idx = data.findIndex((p) => p.id === id);
      if (idx === -1) return res.status(404).json({ error: "Pengantin tidak ditemukan" });

      data[idx] = { ...data[idx], ...updateData };
      await saveData(data);

      return res.status(200).json({ success: true, data: data[idx] });
    } catch (err) {
      console.error("❌ PUT Error:", err);
      return res.status(500).json({ error: "Gagal update data pengantin" });
    }
  }

  // ==== DELETE pengantin berdasarkan ID ====
  if (req.method === "DELETE") {
    try {
      let body = "";
      await new Promise((resolve) => {
        req.on("data", (chunk) => (body += chunk));
        req.on("end", resolve);
      });
      const { id } = JSON.parse(body || "{}");
      if (!id) return res.status(400).json({ error: "ID pengantin wajib diisi" });

      let data = await getData();
      data = data.filter((p) => p.id !== id);
      await saveData(data);

      return res.status(200).json({ success: true, deleted: id });
    } catch (err) {
      console.error("❌ DELETE Error:", err);
      return res.status(500).json({ error: "Gagal menghapus data pengantin" });
    }
  }

  return res.status(405).json({ error: "Method tidak diizinkan" });
}
