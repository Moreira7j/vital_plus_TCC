// Sistema de Recuperação de Senha - Vital+
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const recoveryForm = document.getElementById('recoveryForm');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const userEmail = document.getElementById('userEmail');
    const verificationCode = document.getElementById('verificationCode');
    const resendCode = document.getElementById('resendCode');
    const resendTimer = document.getElementById('resendTimer');
    const timer = document.getElementById('timer');
    const backToEmail = document.getElementById('backToEmail');
    const backToCode = document.getElementById('backToCode');
    const verifyCode = document.getElementById('verifyCode');
    const resetPassword = document.getElementById('resetPassword');
    const statusMessage = document.getElementById('statusMessage');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordMatchError = document.getElementById('passwordMatchError');
    const passwordStrength = document.getElementById('passwordStrength');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    // Variáveis de estado
    let currentStep = 1;
    let userEmailValue = '';
    let verificationToken = '';
    let countdown = 60;
    let countdownInterval;

    console.log('✅ Sistema de recuperação de senha carregado');

    // Menu Mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Fechar menu ao clicar em um link
        document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }

    // Efeito de scroll na navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // Toggle de visibilidade da senha
    toggleNewPassword.addEventListener('click', () => {
        togglePasswordVisibility(newPassword, toggleNewPassword);
    });

    toggleConfirmPassword.addEventListener('click', () => {
        togglePasswordVisibility(confirmPassword, toggleConfirmPassword);
    });

    function togglePasswordVisibility(passwordField, toggleButton) {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        toggleButton.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    }

    // Validação de força da senha
    newPassword.addEventListener('input', validatePasswordStrength);
    confirmPassword.addEventListener('input', validatePasswordMatch);

    function validatePasswordStrength() {
        const password = newPassword.value;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Atualizar requisitos visuais
        updateRequirement('reqLength', requirements.length);
        updateRequirement('reqUppercase', requirements.uppercase);
        updateRequirement('reqLowercase', requirements.lowercase);
        updateRequirement('reqNumber', requirements.number);
        updateRequirement('reqSpecial', requirements.special);

        // Calcular força da senha
        const metRequirements = Object.values(requirements).filter(Boolean).length;
        const strength = (metRequirements / 5) * 100;

        // Atualizar barra de força
        strengthFill.style.width = `${strength}%`;
        
        // Atualizar cores e texto baseado no seu CSS
        if (strength < 40) {
            strengthFill.className = 'strength-fill weak';
            strengthText.textContent = 'Fraca';
        } else if (strength < 70) {
            strengthFill.className = 'strength-fill fair';
            strengthText.textContent = 'Média';
        } else if (strength < 90) {
            strengthFill.className = 'strength-fill good';
            strengthText.textContent = 'Boa';
        } else {
            strengthFill.className = 'strength-fill strong';
            strengthText.textContent = 'Forte';
        }

        // Mostrar/ocultar indicador de força
        passwordStrength.style.display = password ? 'block' : 'none';
    }

    function updateRequirement(elementId, isValid) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isValid) {
                element.classList.add('valid');
            } else {
                element.classList.remove('valid');
            }
        }
    }

    function validatePasswordMatch() {
        const password = newPassword.value;
        const confirm = confirmPassword.value;
        
        if (confirm && password !== confirm) {
            passwordMatchError.textContent = 'As senhas não coincidem';
            passwordMatchError.style.display = 'block';
            return false;
        } else {
            passwordMatchError.style.display = 'none';
            return true;
        }
    }

    // Navegação entre steps
    function showStep(step) {
        console.log(`🔄 Indo para step: ${step}`);
        // Esconder todos os steps
        step1.classList.remove('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        
        // Mostrar step atual
        switch(step) {
            case 1:
                step1.classList.add('active');
                break;
            case 2:
                step2.classList.add('active');
                userEmail.textContent = userEmailValue;
                startCountdown();
                break;
            case 3:
                step3.classList.add('active');
                break;
        }
        
        currentStep = step;
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }

    // Countdown para reenvio de código
    function startCountdown() {
        countdown = 60;
        resendCode.disabled = true;
        resendTimer.style.display = 'block';
        
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            countdown--;
            timer.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                resendCode.disabled = false;
                resendTimer.style.display = 'none';
            }
        }, 1000);
    }

    // Event Listeners
    backToEmail.addEventListener('click', () => {
        showStep(1);
        clearInterval(countdownInterval);
    });

    backToCode.addEventListener('click', () => {
        showStep(2);
    });

    resendCode.addEventListener('click', () => {
        if (resendCode.disabled) return;
        
        console.log('🔄 Reenviando código para:', userEmailValue);
        sendVerificationCode(userEmailValue)
            .then(() => {
                showStatus('Código reenviado com sucesso!', 'success');
                startCountdown();
            })
            .catch(error => {
                console.error('Erro ao reenviar código:', error);
                showStatus('Erro ao reenviar código. Tente novamente.', 'error');
            });
    });

    verifyCode.addEventListener('click', () => {
        const code = verificationCode.value.trim();
        
        if (!code || code.length !== 6) {
            showStatus('Por favor, digite o código de 6 dígitos.', 'error');
            return;
        }

        console.log('🔍 Verificando código:', code);
        verifyCode.disabled = true;
        verifyCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

        verifyVerificationCode(userEmailValue, code)
            .then(token => {
                verificationToken = token;
                showStep(3);
                showStatus('Código verificado com sucesso!', 'success');
            })
            .catch(error => {
                console.error('Erro na verificação:', error);
                showStatus('Código inválido ou expirado. Tente novamente.', 'error');
            })
            .finally(() => {
                verifyCode.disabled = false;
                verifyCode.innerHTML = '<i class="fas fa-check"></i> Verificar Código';
            });
    });

    resetPassword.addEventListener('click', (e) => {
        e.preventDefault();
        
        const password = newPassword.value;
        const confirm = confirmPassword.value;
        
        // Validações
        if (!password || !confirm) {
            showStatus('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        if (!validatePasswordMatch()) {
            return;
        }
        
        if (password.length < 8) {
            showStatus('A senha deve ter pelo menos 8 caracteres.', 'error');
            return;
        }

        console.log('🔄 Redefinindo senha para:', userEmailValue);
        resetPassword.disabled = true;
        resetPassword.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redefinindo...';

        resetPasswordRequest(userEmailValue, verificationToken, password)
            .then(() => {
                showStatus('Senha redefinida com sucesso! Redirecionando para o login...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'LandingPage.html#login';
                }, 3000);
            })
            .catch(error => {
                console.error('Erro ao redefinir senha:', error);
                showStatus('Erro ao redefinir senha. Tente novamente.', 'error');
                resetPassword.disabled = false;
                resetPassword.innerHTML = '<i class="fas fa-key"></i> Redefinir Senha';
            });
    });

    // Form submission
    recoveryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('📝 Formulário submetido - Step atual:', currentStep);
        
        if (currentStep === 1) {
            const email = document.getElementById('email').value.trim();
            console.log('📧 E-mail digitado:', email);
            
            if (!email) {
                showStatus('Por favor, digite seu e-mail.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showStatus('Por favor, digite um e-mail válido.', 'error');
                return;
            }

            console.log('🔄 Enviando código para:', email);
            const submitBtn = recoveryForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            sendVerificationCode(email)
                .then(() => {
                    console.log('✅ Código enviado com sucesso');
                    userEmailValue = email;
                    showStep(2);
                    showStatus('Código enviado com sucesso! Verifique seu e-mail.', 'success');
                })
                .catch(error => {
                    console.error('❌ Erro ao enviar código:', error);
                    showStatus('Erro ao enviar código. Verifique se o e-mail está correto.', 'error');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Código';
                });
        }
    });

    // Funções de API
    async function sendVerificationCode(email) {
        console.log('🌐 Chamando API para enviar código para:', email);
        
        try {
            const response = await fetch('/api/esqueci-senha/enviar-codigo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            console.log('📡 Status da resposta:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                throw new Error('Erro ao enviar código');
            }

            const data = await response.json();
            console.log('✅ Resposta da API:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro na requisição:', error);
            throw error;
        }
    }

    async function verifyVerificationCode(email, code) {
        console.log('🌐 Verificando código:', code, 'para:', email);
        
        try {
            const response = await fetch('/api/esqueci-senha/verificar-codigo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code })
            });

            if (!response.ok) {
                throw new Error('Código inválido');
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('Erro:', error);
            throw error;
        }
    }

    async function resetPasswordRequest(email, token, newPassword) {
        console.log('🌐 Redefinindo senha para:', email);
        
        try {
            const response = await fetch('/api/esqueci-senha/redefinir-senha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, token, newPassword })
            });

            if (!response.ok) {
                throw new Error('Erro ao redefinir senha');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro:', error);
            throw error;
        }
    }

    // Funções auxiliares
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function showStatus(message, type) {
        console.log(`📢 Status: ${type} - ${message}`);
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        
        // Auto-esconder mensagens de sucesso após 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    }

    // Input mask para código de verificação
    verificationCode.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 6);
        e.target.value = value;
    });

    // Auto-focus no próximo campo
    verificationCode.addEventListener('input', (e) => {
        if (e.target.value.length === 6) {
            verifyCode.click();
        }
    });

    // Limpar estado ao recarregar a página
    window.addEventListener('beforeunload', () => {
        clearInterval(countdownInterval);
    });

    console.log('🚀 Sistema de recuperação de senha inicializado com sucesso');
});