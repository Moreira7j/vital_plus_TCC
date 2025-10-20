// LandingPage.js - VERSÃO CORRIGIDA E FUNCIONAL

document.addEventListener("DOMContentLoaded", function () {
    // Inicializar feather icons se disponível
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Configurar menu mobile
    setupMobileMenu();

    // Configurar toggle de senha
    setupPasswordToggle();

    // Configurar formulário de login
    setupLoginForm();

    // Configurar navegação suave
    setupSmoothScrolling();

    // Configurar thumbnails da plataforma web
    setupWebThumbnails();
});

// ====================== Menu Mobile ====================== //
function setupMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
        }));
    }
}

// ====================== Toggle de Senha ====================== //
function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
}

// ====================== Formulário de Login ====================== //
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginMensagem = document.getElementById('loginMensagem');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showLoginMessage('Por favor, preencha todos os campos.', 'error');
                return;
            }

            // Validação básica de email
            if (!validateEmail(email)) {
                showLoginMessage('Por favor, insira um e-mail válido.', 'error');
                return;
            }

            // Mostrar estado de carregamento
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            submitBtn.disabled = true;

            try {
                console.log('📤 Enviando requisição de login para:', email);

                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        senha: password
                    })
                });

                console.log('📥 Resposta recebida, status:', response.status);

                // Verificar se a resposta é JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const textResponse = await response.text();
                    console.error('❌ Servidor retornou não-JSON:', textResponse.substring(0, 200));
                    throw new Error('Resposta inválida do servidor');
                }

                const data = await response.json();
                console.log('📊 Dados da resposta:', data);

                // No setupLoginForm, após o login bem-sucedido:
                if (response.ok) {
                    showLoginMessage('Login realizado com sucesso! Redirecionando...', 'success');

                    // ✅ Salvar dados do usuário
                    console.log('✅ Dados recebidos do login:', data);

                    localStorage.setItem('usuarioId', data.id);
                    localStorage.setItem('usuarioNome', data.nome);
                    localStorage.setItem('usuarioTipo', data.tipo);
                    localStorage.setItem('usuarioLogado', JSON.stringify(data));

                    console.log('✅ Redirecionando para:', data.redirect);

                    // Redirecionar após um breve delay
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1500);
                } else {
                    showLoginMessage(data.error || 'Erro ao fazer login', 'error');
                }
            } catch (error) {
                console.error('❌ Erro no login:', error);

                // Tratamento específico de erros
                if (error.message.includes('Failed to fetch')) {
                    showLoginMessage('Erro: Não foi possível conectar ao servidor. Verifique sua conexão.', 'error');
                } else if (error.message.includes('Unexpected token') || error.message.includes('Resposta inválida')) {
                    showLoginMessage('Erro: Servidor retornou resposta inválida. Contate o administrador.', 'error');
                } else {
                    showLoginMessage('Erro ao conectar com o servidor. Tente novamente.', 'error');
                }
            } finally {
                // Restaurar botão
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Função auxiliar para validação de email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função auxiliar para redirecionamento
function redirectByUserType(userType) {
    const routes = {
        'familiar_contratante': '/dependentes',
        'familiar_cuidador': '/dependentes',
        'cuidador_profissional': '/dashboard_cuidador',
        'admin': '/adm'
    };

    window.location.href = routes[userType] || '/dashboard';
}

// ====================== Mensagens de Login ====================== //
function showLoginMessage(message, type) {
    const loginMensagem = document.getElementById('loginMensagem');
    if (loginMensagem) {
        loginMensagem.textContent = message;
        loginMensagem.className = `login-mensagem ${type}`;
        loginMensagem.style.display = 'block';

        // Esconder mensagem após 5 segundos
        setTimeout(() => {
            loginMensagem.style.display = 'none';
        }, 5000);
    }
}

// ====================== Navegação Suave ====================== //
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ====================== Thumbnails da Plataforma Web ====================== //
function setupWebThumbnails() {
    const thumbnails = document.querySelectorAll('.web-thumbnail');
    const mainImage = document.querySelector('.browser-mockup.large img');

    if (thumbnails.length > 0 && mainImage) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function () {
                // Remover classe active de todos os thumbnails
                thumbnails.forEach(t => t.classList.remove('active'));

                // Adicionar classe active ao thumbnail clicado
                this.classList.add('active');

                // Trocar imagem principal
                const newSrc = this.querySelector('img').getAttribute('data-full');
                if (newSrc) {
                    mainImage.src = newSrc;
                }
            });
        });
    }
}

// ====================== Animações de Scroll ====================== //
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observar elementos que devem ser animados
    document.querySelectorAll('.feature-card, .app-feature, .web-feature').forEach(el => {
        observer.observe(el);
    });
}

// Inicializar animações de scroll quando a página carregar
window.addEventListener('load', setupScrollAnimations);