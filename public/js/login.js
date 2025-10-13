// Inicializar feather icons
document.addEventListener("DOMContentLoaded", function () {
    feather.replace();
    setupPasswordToggle(); // Adicionar esta linha para inicializar o toggle de senha


    // Elementos da DOM
    const loginForm = document.getElementById('loginForm');
    const dependentsSection = document.getElementById('dependentsSection');
    const loginButton = document.getElementById('loginButton');
    const backButton = document.getElementById('backButton');
    const accessButton = document.getElementById('accessButton');
    const dependentCards = document.querySelectorAll('.dependent-card');

    // Variáveis de estado
    let selectedDependent = null;

    // Event Listeners
    loginButton.addEventListener('click', handleLogin);
    backButton.addEventListener('click', handleBack);
    accessButton.addEventListener('click', handleAccess);

    // Adicionar event listeners para os cards de dependentes
    dependentCards.forEach(card => {
        card.addEventListener('click', function () {
            selectDependent(this);
        });
    });

    // Função para lidar com o login
    function handleLogin(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Validação básica
        if (!email || !password) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Simulação de autenticação
        simulateLogin(email, password);
    }

    // Função para fazer login real com a API
    async function simulateLogin(email, password) {
        // Mostrar estado de carregamento
        loginButton.innerHTML = '<i data-feather="loader" class="spinner"></i> Entrando...';
        loginButton.disabled = true;
        feather.replace();

        try {
            // Fazer requisição real para a API
            console.log("Tentando fazer login com:", { email: email, senha: password });
            const response = await fetch("/api/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    senha: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Mostrar erro de login
                alert(data.error || 'Erro ao fazer login');
                return;
            }

            // Login bem-sucedido
            const userData = {
                id: data.id,
                name: data.nome,
                tipo: data.tipo,
                dependents: [
                    { id: 1, name: 'João Silva', age: 72, condition: 'Hipertensão' },
                    { id: 2, name: 'Ana Santos', age: 68, condition: 'Diabetes' },
                    { id: 3, name: 'Carlos Oliveira', age: 75, condition: 'Cardíaco' }
                ]
            };

            // Salvar dados do usuário no localStorage
            localStorage.setItem('userData', JSON.stringify(userData));

            // Atualizar a interface com os dados do usuário
            updateUserInterface(userData);

            // Mostrar seção de seleção de dependentes
            loginForm.style.display = 'none';
            dependentsSection.style.display = 'block';

        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao conectar com o servidor');
        } finally {
            // Restaurar botão de login
            loginButton.innerHTML = '<i data-feather="log-in"></i> Entrar';
            loginButton.disabled = false;
            feather.replace();
        }
    }

    // Função para atualizar a interface com os dados do usuário
    function updateUserInterface(userData) {
        // Atualizar saudação
        document.querySelector('.user-welcome').textContent = `Olá, ${userData.name}`;

        // Em uma implementação real, os dependentes seriam carregados dinamicamente
        // baseado nos dados retornados do servidor
    }

    // Função para selecionar um dependente
    function selectDependent(card) {
        // Remover seleção anterior
        dependentCards.forEach(c => c.classList.remove('selected'));

        // Adicionar seleção ao card clicado
        card.classList.add('selected');

        // Obter ID do dependente selecionado
        selectedDependent = card.getAttribute('data-id');

        // Habilitar botão de acesso
        accessButton.disabled = false;
    }

    // Função para voltar para a tela de login
    function handleBack() {
        dependentsSection.style.display = 'none';
        loginForm.style.display = 'block';

        // Resetar seleção
        dependentCards.forEach(c => c.classList.remove('selected'));
        selectedDependent = null;
        accessButton.disabled = true;
    }

    // Função para acessar o acompanhamento do dependente selecionado
    // Função para acessar o acompanhamento do dependente selecionado
    function handleAccess() {
        if (!selectedDependent) {
            alert('Por favor, selecione um dependente.');
            return;
        }

        // Mostrar estado de carregamento
        accessButton.innerHTML = '<i data-feather="loader" class="spinner"></i> Acessando...';
        accessButton.disabled = true;
        feather.replace();

        // Simular carregamento e redirecionar para index.html
        setTimeout(() => {
            // Redirecionar para a página index com o ID do dependente como parâmetro
            window.location.href = `index.html?dependent=${selectedDependent}`;
        }, 1000);
    }

    // Adicionar animação de loading para os ícones
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spinner {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
});


// ====================== Toggle de senha ====================== //

function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

