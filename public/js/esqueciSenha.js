// Menu mobile
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

// Formulário de recuperação de senha
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const backToEmailLink = document.getElementById("backToEmail");

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const email = document.getElementById("recoveryEmail").value;
        
        // Validação
        if (!email) {
            alert("Por favor, informe seu e-mail.");
            return;
        }
        
        // Simulação de envio de e-mail
        alert("Instruções de recuperação enviadas para: " + email);
        
        // Mostrar formulário de redefinição de senha
        forgotPasswordForm.style.display = "none";
        resetPasswordForm.style.display = "block";
    });
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const code = document.getElementById("resetCode").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;
        
        // Validação
        if (!code || !newPassword || !confirmNewPassword) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            alert("As senhas não coincidem.");
            return;
        }
        
        if (newPassword.length < 8) {
            alert("A senha deve ter pelo menos 8 caracteres.");
            return;
        }
        
        // Simulação de redefinição bem-sucedida
        alert("Senha redefinida com sucesso! Redirecionando para o login...");
        
        // Redirecionar para a página de login
        setTimeout(() => {
            window.location.href = "../LandingPage.html#login";
        }, 1500);
    });
}

if (backToEmailLink) {
    backToEmailLink.addEventListener("click", function(e) {
        e.preventDefault();
        resetPasswordForm.style.display = "none";
        forgotPasswordForm.style.display = "block";
    });
}

// Scroll suave para links internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute("href");
        if (targetId === "#") return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: "smooth"
            });
        }
    });
});