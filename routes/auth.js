router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Preencha todos os campos.' });

    try {
        const [user] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (!user.length) return res.status(401).json({ error: 'Usuário não encontrado.' });

        if (user[0].senha !== password) return res.status(401).json({ error: 'Senha incorreta.' });

        res.json({ nome: user[0].nome, tipo: user[0].tipo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no servidor.' });
    }
    if (res.ok) {
        localStorage.setItem("usuarioNome", data.nome);

        if (data.tipo === "familiar") window.location.href = "dependentes.html";
        else if (data.tipo === "cuidador") window.location.href = "dashboard_cuidador.html";
        else window.location.href = "admin.html";
    } else {
        mensagem.innerText = data.error;
        mensagem.style.color = "red";
    }

});
