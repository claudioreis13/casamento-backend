// ===== CARREGA AS VARIÁVEIS DE AMBIENTE =====
require("dotenv").config();

// ===== IMPORTA AS BIBLIOTECAS =====
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// ===== CONFIGURA O FIREBASE =====
const serviceAccount = require(process.env.FIREBASE_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Referência ao banco de dados
const db = admin.firestore();
const colecao = db.collection("reservados");

// ===== CONFIGURA O SERVIDOR =====
const app = express();
const PORT = process.env.PORT || 3001;

// Permite que o site acesse o backend
app.use(cors());

// Permite receber dados em JSON
app.use(express.json());

// ===== ROTA DE TESTE =====
// Acesse http://localhost:3001/ para verificar se está funcionando
app.get("/", (req, res) => {
  res.json({ status: "ok", mensagem: "Backend do casamento funcionando! 💍" });
});

// ===== ROTA — LISTAR PRESENTES RESERVADOS =====
// GET /reservados
// Retorna a lista de IDs dos presentes já reservados
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

// ===== ROTA — RESERVAR UM PRESENTE =====
// POST /reservar
// Recebe { id: "nome-do-presente" } e salva no banco
app.post("/reservar", async (req, res) => {
  const { id } = req.body;

  // Valida se o ID foi enviado
  if (!id) {
    return res.status(400).json({ erro: "ID do presente é obrigatório" });
  }

  try {
    // Verifica se o presente já está reservado
    const snapshot = await colecao.where("id", "==", id).get();

    if (!snapshot.empty) {
      return res.status(409).json({ erro: "Presente já reservado", id });
    }

    // Salva a reserva no banco
    await colecao.add({
      id,
      reservadoEm: new Date().toISOString(),
    });

    res.json({ sucesso: true, mensagem: `Presente "${id}" reservado com sucesso!` });
  } catch (erro) {
    console.error("Erro ao reservar:", erro);
    res.status(500).json({ erro: "Erro ao reservar presente" });
  }
});

// ===== INICIA O SERVIDOR =====
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});