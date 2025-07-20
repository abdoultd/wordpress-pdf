const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password:'abdou',           // Mets ton mot de passe ici
  database: 'documents_db'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('✅ Connecté à MySQL');
});

module.exports = connection;
