document.addEventListener("DOMContentLoaded", function() {
    const activateAccountForm = document.getElementById("activateAccountForm");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
    const errorMessage = document.getElementById("errorMessage");

    // Obter o token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
        errorMessage.textContent = "Token de ativação não encontrado.";
        errorMessage.style.display = "block";
        return;
    }

    activateAccountForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (newPassword !== confirmNewPassword) {
            errorMessage.textContent = "As senhas não coincidem.";
            errorMessage.style.display = "block";
            return;
        }

        if (newPassword.length < 8) {
            errorMessage.textContent = "A nova senha deve ter pelo menos 8 caracteres.";
            errorMessage.style.display = "block";
            return;
        }

        try {
            const response = await fetch("/api/ativar_conta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token, newPassword: newPassword })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Sua conta foi ativada e a senha foi definida com sucesso! Você será redirecionado para a página de login.");
                window.location.href = "LandingPage.html"; // Redirecionar para a página de login
            } else {
                errorMessage.textContent = result.error || "Erro ao ativar a conta.";
                errorMessage.style.display = "block";
            }
        } catch (error) {
            console.error("Erro ao conectar com o servidor:", error);
            errorMessage.textContent = "Erro ao conectar com o servidor. Tente novamente mais tarde.";
            errorMessage.style.display = "block";
        }
    });
});
