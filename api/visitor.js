export default async function handler(req, res) {
  const UPSTASH_URL = "https://immune-civet-10584.upstash.io";
  const AUTH_TOKEN =
    process.env.UPSTASH_AUTH_TOKEN ||
    "Bearer ASlYAAIncDJhMjc4ZDRjYzU4NDM0M2E0OWUwY2Q0N2M3Y2RmZmI2ZnAyMTA1ODQ";

  const pasangan = req.query.pasangan;
  const tamu = req.query.to;
  const view = req.query.view;

  if (!pasangan)
    return res.status(400).json({ error: "Parameter ?pasangan wajib diisi" });

  // ==== CORS ====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ==== Fungsi bantu ====
  async function getData() {
    const getRes = await fetch(`${UPSTASH_URL}/get/visitor:${pasangan}`, {
      headers: { Authorization: AUTH_TOKEN },
    });
    const data = await getRes.json();

    try {
      if (!data.result) return { pengunjung: [] };

      const parsed = JSON.parse(data.result);

      // Auto deteksi struktur data lama
      if (parsed.visitors && Array.isArray(parsed.visitors)) {
        return { pengunjung: parsed.visitors };
      }

      if (parsed.pengunjung && Array.isArray(parsed.pengunjung)) {
        return { pengunjung: parsed.pengunjung };
      }

      return { pengunjung: [] };
    } catch {
      return { pengunjung: [] };
    }
  }

  async function saveData(data) {
    await fetch(`${UPSTASH_URL}/set/visitor:${pasangan}`, {
      method: "POST",
      headers: {
        Authorization: AUTH_TOKEN,
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(data),
    });
  }

  try {
    // ==== GET ====
    if (req.method === "GET") {
      const data = await getData();

      if (view === "all") {
        return res.status(200).json({
          pasangan,
          totalPengunjung: data.pengunjung.length,
          pengunjung: data.pengunjung,
        });
      }

      return res.status(200).json({
        pasangan,
        totalPengunjung: data.pengunjung.length,
      });
    }

    // ==== POST ====
    if (req.method === "POST") {
      if (!tamu)
        return res
          .status(400)
          .json({ error: "Parameter ?to (nama tamu) wajib diisi" });

      const current = await getData();
      const sudahAda = current.pengunjung.find(
        (v) => v.nama.toLowerCase() === tamu.toLowerCase()
      );

      if (sudahAda) {
        return res.status(200).json({
          success: false,
          message: "Tamu sudah pernah berkunjung",
        });
      }

      const newVisitor = {
        nama: tamu,
        waktu: new Date().toISOString(),
      };

      current.pengunjung.push(newVisitor);
      await saveData({ pengunjung: current.pengunjung });

      return res.status(200).json({
        success: true,
        message: "Pengunjung baru tercatat",
        data: newVisitor,
      });
    }

    return res.status(405).json({ error: "Method tidak diizinkan" });
  } catch (err) {
    console.error("❌ Visitor API Error:", err);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
