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

    // Configurar thumbnails do app mobile
    setupMobileThumbnails();

    // Configurar modal de fotos
    setupPhotoModal();

    // Configurar navbar scroll effect
    setupNavbarScroll();

    // Configurar animações de scroll
    setupScrollAnimations();

    // Configurar efeitos hover nas imagens
    setupImageHoverEffects();

    // Configurar funcionalidade das setas do teclado
    setupKeyboardNavigation();
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

// ====================== Thumbnails do App Mobile ====================== //
function setupMobileThumbnails() {
    const mobileThumbnails = document.querySelectorAll('.app-thumbnail');
    const phoneMockups = document.querySelectorAll('.phone-mockup img');

    if (mobileThumbnails.length > 0 && phoneMockups.length > 0) {
        mobileThumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function () {
                // Remover classe active de todos os thumbnails
                mobileThumbnails.forEach(t => t.classList.remove('active'));

                // Adicionar classe active ao thumbnail clicado
                this.classList.add('active');

                // Trocar imagens dos phone mockups
                const newSrc = this.querySelector('img').getAttribute('data-full');
                if (newSrc) {
                    phoneMockups.forEach(mockup => {
                        mockup.src = newSrc;
                    });
                }
            });
        });
    }
}

// ====================== Modal de Fotos ====================== //
function setupPhotoModal() {
    const photoModal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.querySelector('.photo-modal-caption');
    const modalClose = document.querySelector('.photo-modal-close');

    if (!photoModal || !modalImage) return;

    // Adicionar funcionalidade de clique nas imagens
    const clickableImages = document.querySelectorAll(
        '.phone-mockup img, .browser-mockup img, .benefits-image-container img, .hero-image-container img, .app-thumbnail img, .web-thumbnail img'
    );

    clickableImages.forEach(img => {
        img.addEventListener('click', function () {
            const imgSrc = this.src;
            const imgAlt = this.alt || 'Imagem do Vital+';
            
            modalImage.src = imgSrc;
            modalCaption.textContent = imgAlt;
            photoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Fechar modal
    if (modalClose) {
        modalClose.addEventListener('click', function () {
            photoModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Fechar modal clicando fora da imagem
    photoModal.addEventListener('click', function (e) {
        if (e.target === photoModal) {
            photoModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && photoModal.classList.contains('active')) {
            photoModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// ====================== Navbar Scroll Effect ====================== //
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
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
    const elementsToAnimate = document.querySelectorAll(
        '.feature-card, .mobile-feature, .web-feature, .benefit-item, .phone-mockup, .browser-mockup'
    );
    
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });
}

// ====================== Efeitos Hover nas Imagens ====================== //
function setupImageHoverEffects() {
    // Efeito de escala nas imagens dos cards
    const hoverImages = document.querySelectorAll('.feature-card, .benefit-item, .phone-mockup, .browser-mockup');
    
    hoverImages.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Efeito de brilho nas imagens principais
    const mainImages = document.querySelectorAll('.hero-image-container img, .benefits-image-container img');
    
    mainImages.forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.1)';
        });
        
        img.addEventListener('mouseleave', function() {
            this.style.filter = 'brightness(1)';
        });
    });
}

// ====================== Navegação por Teclado ====================== //
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Navegação entre seções com Tab
        if (e.key === 'Tab') {
            e.preventDefault();
            // Lógica de navegação por tab pode ser adicionada aqui
        }

        // Atalhos de teclado para funcionalidades específicas
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
                    break;
                case '2':
                    e.preventDefault();
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                    break;
                case '3':
                    e.preventDefault();
                    document.getElementById('mobile-app')?.scrollIntoView({ behavior: 'smooth' });
                    break;
                case '4':
                    e.preventDefault();
                    document.getElementById('web-platform')?.scrollIntoView({ behavior: 'smooth' });
                    break;
                case '5':
                    e.preventDefault();
                    document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' });
                    break;
            }
        }
    });
}

// ====================== Carregamento Otimizado de Imagens ====================== //
function setupImageLoading() {
    // Lazy loading para imagens
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// ====================== Feedback de Carregamento ====================== //
function setupLoadingFeedback() {
    // Mostrar spinner durante o carregamento de imagens pesadas
    const heavyImages = document.querySelectorAll('.hero-image-container img, .browser-mockup img');
    
    heavyImages.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.style.transition = 'opacity 0.5s ease';
        });
        
        img.addEventListener('error', function() {
            console.error('Erro ao carregar imagem:', this.src);
            this.alt = 'Imagem não disponível';
        });
    });
}

// ====================== Inicialização Final ====================== //
window.addEventListener('load', function() {
    // Inicializar funcionalidades que dependem do carregamento completo
    setupImageLoading();
    setupLoadingFeedback();
    
    // Atualizar feather icons após carregamento dinâmico
    if (typeof feather !== 'undefined') {
        setTimeout(() => {
            feather.replace();
        }, 100);
    }

    // Adicionar classe loaded para animações de entrada
    document.body.classList.add('loaded');

    console.log('✅ Landing Page Vital+ carregada com sucesso!');
});

// ====================== Utilitários Globais ====================== //
// Função para debounce (otimização de performance)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Função para throttle (otimização de performance)
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Exportar funções para uso global (se necessário)
if (typeof window !== 'undefined') {
    window.VitalPlusLanding = {
        debounce,
        throttle,
        validateEmail,
        showLoginMessage
    };
}

