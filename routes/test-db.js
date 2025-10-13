const mysql = require('mysql2');

// Configuração da conexão
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // ou outro usuário que você criou
    password: 'Root@123', // coloque sua senha aqui
    database: 'vital_plus'
});

// Conectar
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no MySQL:', err.message);
        return;
    }
    console.log('Conexão com MySQL realizada com sucesso!');

    // Inserir um usuário de teste
    const sqlInsert = `
        INSERT INTO usuarios (nome, email, senha, tipo) 
        VALUES (?, ?, ?, ?)
    `;
    const values = ['Teste Usuario', 'teste@email.com', '123456', 'familiar'];

    connection.query(sqlInsert, values, (err, result) => {
        if (err) {
            console.error('Erro ao inserir usuário:', err.message);
        } else {
            console.log('Usuário inserido com sucesso, ID:', result.insertId);

            // Ler o usuário recém inserido
            connection.query('SELECT * FROM usuarios WHERE id = ?', [result.insertId], (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar usuário:', err.message);
                } else {
                    console.log('Usuário encontrado no banco:', rows);
                }
                connection.end(); // fecha conexão
            });
        }
    });
});
