const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware JSON avec limite augmentée (doit être AVANT les routes)
app.use(express.json({ limit: '500mb' }));

// Configuration MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password:'abdou',
  database: 'documents_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connecté à la base MySQL !");
    connection.release();
  } catch (err) {
    console.error("❌ Erreur de connexion à MySQL :", err);
  }
}
testConnection();

const uploadsDir = path.join(__dirname, 'uploads');

// Vérifier si le dossier existe, sinon le créer
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.post('/save-pdf', async (req, res) => {
  const { pdfBase64, filename } = req.body;

  console.log('📄 Reçu filename :', filename);
  console.log('📄 Base64 reçu (début) :', pdfBase64 ? pdfBase64.slice(0, 50) : 'Aucun');

  if (!pdfBase64 || !filename) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const buffer = Buffer.from(pdfBase64, 'base64');
  const filePath = path.join(uploadsDir, filename);

  console.log('💾 Chemin fichier :', filePath);
  console.log('💾 Taille buffer :', buffer.length);

  try {
    // Sauvegarder le fichier localement
    await fs.promises.writeFile(filePath, buffer);
    console.log('✅ Fichier écrit sur le disque.');

    // Sauvegarder dans la base MySQL
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO pdf_documents (filename, data) VALUES (?, ?)',
      [filename, buffer]
    );
    console.log('✅ Insertion MySQL OK.');
    connection.release();

    res.json({ message: 'PDF sauvegardé sur disque et en base MySQL !' });

  } catch (err) {
    console.error('❌ Erreur sauvegarde PDF :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route test DB
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now');
    res.json({ message: "Connexion OK", time: rows[0].now });
  } catch (err) {
    res.status(500).json({ error: "Erreur de connexion à la base" });
  }
});

// Servir fichiers statiques (ex: dossier public)
app.use(express.static(path.join(__dirname, 'public')));

// Lancement serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
