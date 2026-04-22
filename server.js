require("dotenv").config();

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// ===== FIREBASE =====
let serviceAccount;

try {
  const raw = process.env.FIREBASE_KEY_JSON;
  if (!raw) throw new Error("FIREBASE_KEY_JSON não definida");
  serviceAccount = JSON.parse(raw);
  console.log("✅ Chave Firebase carregada da variável de ambiente");
} catch (e) {
  console.error("❌ Erro ao carregar chave Firebase:", e.message);
  process.exit(1); // Para o servidor imediatamente com mensagem clara
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const colecao = db.collection("reservados");

// ===== SERVIDOR =====
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", mensagem: "Backend do casamento funcionando! 💍" });
});

app.get("/reservados", async (req, res) => {
  try {
    const snapshot = await colecao.get();
    const ids = snapshot.docs.map((doc) => doc.data().id);
    res.json({ reservados: ids });
  } catch (erro) {
    console.error("Erro ao buscar reservados:", erro);
    res.status(500).json({ erro: "Erro ao buscar presentes reservados" });
  }
});

app.post("/reservar", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ erro: "ID do presente é obrigatório" });

  try {
    const snapshot = await colecao.where("id", "==", id).get();
    if (!snapshot.empty) {
      return res.status(409).json({ erro: "Presente já reservado", id });
    }
    await colecao.add({ id, reservadoEm: new Date().toISOString() });
    res.json({ sucesso: true, mensagem: `Presente "${id}" reservado!` });
  } catch (erro) {
    console.error("Erro ao reservar:", erro);
    res.status(500).json({ erro: "Erro ao reservar presente" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});