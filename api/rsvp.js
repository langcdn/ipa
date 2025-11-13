// api/rsvp.js
export default async function handler(req, res) {
  const UPSTASH_URL = "https://immune-civet-10584.upstash.io";
  const AUTH_TOKEN =
    process.env.UPSTASH_AUTH_TOKEN ||
    "Bearer ASlYAAIncDJhMjc4ZDRjYzU4NDM0M2E0OWUwY2Q0N2M3Y2RmZmI2ZnAyMTA1ODQ";

  // Ambil pasangan dari query
  const pasangan = req.query.pasangan;
  if (!pasangan) {
    return res.status(400).json({
      error: "Parameter ?pasangan=nama-pengantin wajib diisi.",
    });
  }

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET: Ambil semua data RSVP
  if (req.method === "GET") {
    try {
      const getRes = await fetch(`${UPSTASH_URL}/get/rsvp:${pasangan}`, {
        headers: { Authorization: AUTH_TOKEN },
      });
      const data = await getRes.json();
      const result = data.result ? JSON.parse(data.result) : [];
      return res.status(200).json(result);
    } catch (err) {
      console.error("❌ Error GET:", err);
      return res.status(500).json({ error: "Gagal mengambil data" });
    }
  }

  // POST: Simpan RSVP baru
  if (req.method === "POST") {
    try {
      const body = req.body; // <- Perbaikan: pakai req.body
      const { nama, hadir, ucapan } = body;

      if (!nama || !hadir || !ucapan)
        return res.status(400).json({ error: "Data tidak lengkap" });

      const getRes = await fetch(`${UPSTASH_URL}/get/rsvp:${pasangan}`, {
        headers: { Authorization: AUTH_TOKEN },
      });
      const getData = await getRes.json();
      const list = getData.result ? JSON.parse(getData.result) : [];

      const newData = {
        nama,
        hadir,
        ucapan,
        waktu: new Date().toISOString(),
      };
      list.push(newData);

      await fetch(`${UPSTASH_URL}/set/rsvp:${pasangan}`, {
        method: "POST",
        headers: {
          Authorization: AUTH_TOKEN,
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(list),
      });

      return res.status(200).json({
        success: true,
        pasangan,
        data: newData,
        total: list.length,
      });
    } catch (err) {
      console.error("❌ Error POST:", err);
      return res.status(500).json({ error: "Gagal menyimpan data" });
    }
  }

  return res.status(405).json({ error: "Method tidak diizinkan" });
}
