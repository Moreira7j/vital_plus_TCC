// criarContaFamiliarContratante.js

document.addEventListener("DOMContentLoaded", function() {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    initializeApp();
});

function initializeApp() {
    setupMobileMenu();
    setupPasswordToggle();
    setupImagePreview();
    setupMasks();
    showStep(currentStep);
}

// ====================== Menu mobile ====================== //

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

// ====================== Lógica de múltiplos passos do formulário ====================== //

let currentStep = 1;
const totalSteps = 4;

function showStep(step) {
    document.querySelectorAll(".signup-step").forEach((s, index) => {
        s.classList.toggle("active", index + 1 === step);
    });
    
    document.querySelectorAll(".progress-indicator .step").forEach((s, index) => {
        s.classList.toggle("active", index + 1 === step);
        s.classList.toggle("completed", index + 1 < step);
    });
}

function nextStep() {
    if (currentStep === 1) {
        if (!validateStep1()) return;
        saveFamiliarData();
    } else if (currentStep === 2) {
        if (!validateStep2()) return;
        saveDependenteData();
    } else if (currentStep === 3) {
        if (!validateStep3()) return;
        saveCuidadorData();
        displaySummary();
    }
    
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function validateStep1() {
    const nome = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("phone").value.trim();
    const data_nascimento = document.getElementById("birthDate").value;
    const parentesco = document.getElementById("parentesco").value;
    const endereco = document.getElementById("endereco").value.trim();
    const senha = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if (!nome || !email || !telefone || !data_nascimento || !parentesco || !endereco || !senha || !confirmPassword) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return false;
    }

    if (!validarEmail(email)) {
        alert("Por favor, insira um e-mail válido.");
        return false;
    }

    if (senha !== confirmPassword) {
        alert("As senhas não coincidem.");
        return false;
    }

    if (senha.length < 8) {
        alert("A senha deve ter pelo menos 8 caracteres.");
        return false;
    }

    const birthDateObj = new Date(data_nascimento);
    const today = new Date();
    const age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0)) {
        alert("Você deve ter pelo menos 18 anos para se cadastrar.");
        return false;
    }

    if (!terms) {
        alert("Você deve aceitar os termos de uso.");
        return false;
    }

    return true;
}

function validateStep2() {
    const nomeDependente = document.getElementById("nomeDependente").value.trim();
    const dataNascimentoDependente = document.getElementById("dataNascimentoDependente").value;
    const condicaoPrincipal = document.getElementById("condicaoPrincipal").value.trim();
    const contatoEmergencia = document.getElementById("contatoEmergencia").value.trim();

    if (!nomeDependente || !dataNascimentoDependente || !condicaoPrincipal || !contatoEmergencia) {
        alert("Por favor, preencha todos os campos obrigatórios do dependente.");
        return false;
    }

    const birthDateObj = new Date(dataNascimentoDependente);
    const today = new Date();
    
    if (birthDateObj > today) {
        alert("A data de nascimento do dependente não pode ser no futuro.");
        return false;
    }

    return true;
}

function validateStep3() {
    const nomeCuidador = document.getElementById("nomeCuidador").value.trim();
    const emailCuidador = document.getElementById("emailCuidador").value.trim();
    const telefoneCuidador = document.getElementById("telefoneCuidador").value.trim();
    const cpfCuidador = document.getElementById("cpfCuidador").value.trim();
    const especializacao = document.getElementById("especializacao").value;
    const registro_profissional = document.getElementById("registro_profissional").value.trim();
    const experiencia = document.getElementById("experiencia").value;
    const disponibilidade = document.getElementById("disponibilidade").value;

    if (!nomeCuidador || !emailCuidador || !telefoneCuidador || !cpfCuidador || !especializacao || !registro_profissional || !experiencia || !disponibilidade) {
        alert("Por favor, preencha todos os campos obrigatórios do cuidador.");
        return false;
    }

    if (!validarEmail(emailCuidador)) {
        alert("Por favor, insira um e-mail válido para o cuidador.");
        return false;
    }

    if (!validarCPF(cpfCuidador)) {
        alert("Por favor, insira um CPF válido para o cuidador.");
        return false;
    }

    if (parseInt(experiencia) < 0) {
        alert("A experiência não pode ser negativa.");
        return false;
    }

    return true;
}

function saveFamiliarData() {
    const familiarData = {
        nome: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        telefone: document.getElementById("phone").value.trim(),
        data_nascimento: document.getElementById("birthDate").value,
        parentesco: document.getElementById("parentesco").value,
        endereco: document.getElementById("endereco").value.trim(),
        senha: document.getElementById("password").value,
        tipo: 'familiar_contratante'
    };

    localStorage.setItem('dadosFamiliar', JSON.stringify(familiarData));
}

function saveDependenteData() {
    const dependenteData = {
        nome: document.getElementById("nomeDependente").value.trim(),
        data_nascimento: document.getElementById("dataNascimentoDependente").value,
        genero: document.getElementById("generoDependente").value,
        condicao_principal: document.getElementById("condicaoPrincipal").value.trim(),
        plano_saude: document.getElementById("planoSaude").value.trim(),
        alergias: document.getElementById("alergias").value.trim(),
        historico_medico: document.getElementById("historicoMedico").value.trim(),
        contato_emergencia: document.getElementById("contatoEmergencia").value.trim(),
        foto_perfil: document.getElementById("fotoDependente").files[0] ? document.getElementById("fotoDependente").files[0].name : null
    };

    localStorage.setItem('dadosDependente', JSON.stringify(dependenteData));
}

function saveCuidadorData() {
    const cuidadorData = {
        nome: document.getElementById("nomeCuidador").value.trim(),
        email: document.getElementById("emailCuidador").value.trim(),
        telefone: document.getElementById("telefoneCuidador").value.trim(),
        cpf: document.getElementById("cpfCuidador").value.trim(),
        especializacao: document.getElementById("especializacao").value,
        registro_profissional: document.getElementById("registro_profissional").value.trim(),
        experiencia: document.getElementById("experiencia").value,
        disponibilidade: document.getElementById("disponibilidade").value,
        senha: gerarSenhaTemporaria(),
        tipo: 'cuidador_profissional'
    };

    localStorage.setItem('dadosCuidador', JSON.stringify(cuidadorData));
}

function displaySummary() {
    const familiarData = JSON.parse(localStorage.getItem('dadosFamiliar'));
    const dependenteData = JSON.parse(localStorage.getItem('dadosDependente'));
    const cuidadorData = JSON.parse(localStorage.getItem('dadosCuidador'));

    const familiarSummaryDiv = document.getElementById('familiarSummary');
    familiarSummaryDiv.innerHTML = `
        <div class="summary-item"><span class="summary-label">Nome:</span> <span class="summary-value">${familiarData.nome}</span></div>
        <div class="summary-item"><span class="summary-label">Email:</span> <span class="summary-value">${familiarData.email}</span></div>
        <div class="summary-item"><span class="summary-label">Telefone:</span> <span class="summary-value">${familiarData.telefone}</span></div>
        <div class="summary-item"><span class="summary-label">Parentesco:</span> <span class="summary-value">${formatarParentesco(familiarData.parentesco)}</span></div>
    `;

    const dependenteSummaryDiv = document.getElementById('dependenteSummary');
    dependenteSummaryDiv.innerHTML = `
        <div class="summary-item"><span class="summary-label">Nome:</span> <span class="summary-value">${dependenteData.nome}</span></div>
        <div class="summary-item"><span class="summary-label">Nascimento:</span> <span class="summary-value">${formatarData(dependenteData.data_nascimento)}</span></div>
        <div class="summary-item"><span class="summary-label">Gênero:</span> <span class="summary-value">${formatarGenero(dependenteData.genero)}</span></div>
        <div class="summary-item"><span class="summary-label">Condição Principal:</span> <span class="summary-value">${dependenteData.condicao_principal}</span></div>
        <div class="summary-item"><span class="summary-label">Plano de Saúde:</span> <span class="summary-value">${dependenteData.plano_saude || 'Não informado'}</span></div>
        <div class="summary-item"><span class="summary-label">Contato de Emergência:</span> <span class="summary-value">${dependenteData.contato_emergencia}</span></div>
        ${dependenteData.foto_perfil ? `<div class="summary-item"><span class="summary-label">Foto:</span> <span class="summary-value">${dependenteData.foto_perfil}</span></div>` : ''}
    `;

    const cuidadorSummaryDiv = document.getElementById('cuidadorSummary');
    cuidadorSummaryDiv.innerHTML = `
        <div class="summary-item"><span class="summary-label">Nome:</span> <span class="summary-value">${cuidadorData.nome}</span></div>
        <div class="summary-item"><span class="summary-label">Email:</span> <span class="summary-value">${cuidadorData.email}</span></div>
        <div class="summary-item"><span class="summary-label">Telefone:</span> <span class="summary-value">${cuidadorData.telefone}</span></div>
        <div class="summary-item"><span class="summary-label">CPF:</span> <span class="summary-value">${cuidadorData.cpf}</span></div>
        <div class="summary-item"><span class="summary-label">Especialização:</span> <span class="summary-value">${formatarEspecializacao(cuidadorData.especializacao)}</span></div>
        <div class="summary-item"><span class="summary-label">Registro Profissional:</span> <span class="summary-value">${cuidadorData.registro_profissional}</span></div>
        <div class="summary-item"><span class="summary-label">Experiência:</span> <span class="summary-value">${cuidadorData.experiencia} anos</span></div>
        <div class="summary-item"><span class="summary-label">Disponibilidade:</span> <span class="summary-value">${formatarDisponibilidade(cuidadorData.disponibilidade)}</span></div>
    `;
}

async function finalizarCadastro() {
    const familiarData = JSON.parse(localStorage.getItem('dadosFamiliar'));
    const dependenteData = JSON.parse(localStorage.getItem('dadosDependente'));
    const cuidadorData = JSON.parse(localStorage.getItem('dadosCuidador'));
    const fotoDependenteFile = document.getElementById("fotoDependente").files[0];

    const finalizeBtn = document.getElementById("finalizeBtn");
    finalizeBtn.classList.add("loading");
    finalizeBtn.disabled = true;
    finalizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

    try {
        // Preparar FormData para envio completo
        const formData = new FormData();
        
        // Dados do familiar
        formData.append('familiar_nome', familiarData.nome);
        formData.append('familiar_email', familiarData.email);
        formData.append('familiar_senha', familiarData.senha);
        formData.append('familiar_telefone', familiarData.telefone);
        formData.append('familiar_data_nascimento', familiarData.data_nascimento);
        formData.append('familiar_parentesco', familiarData.parentesco);
        formData.append('familiar_endereco', familiarData.endereco);
        
        // Dados do dependente
        formData.append('dependente_nome', dependenteData.nome);
        formData.append('dependente_data_nascimento', dependenteData.data_nascimento);
        formData.append('dependente_genero', dependenteData.genero || '');
        formData.append('dependente_condicao_principal', dependenteData.condicao_principal);
        formData.append('dependente_plano_saude', dependenteData.plano_saude || '');
        formData.append('dependente_alergias', dependenteData.alergias || '');
        formData.append('dependente_historico_medico', dependenteData.historico_medico || '');
        formData.append('dependente_contato_emergencia', dependenteData.contato_emergencia);
        
        // Dados do cuidador
        formData.append('cuidador_nome', cuidadorData.nome);
        formData.append('cuidador_email', cuidadorData.email);
        formData.append('cuidador_telefone', cuidadorData.telefone);
        formData.append('cuidador_cpf', cuidadorData.cpf);
        formData.append('cuidador_especializacao', cuidadorData.especializacao);
        formData.append('cuidador_registro_profissional', cuidadorData.registro_profissional);
        formData.append('cuidador_experiencia', cuidadorData.experiencia);
        formData.append('cuidador_disponibilidade', cuidadorData.disponibilidade);

        // Adicionar arquivo de foto se existir
        if (fotoDependenteFile) {
            formData.append('foto_perfil', fotoDependenteFile);
        }

        console.log("Enviando dados para cadastro completo...");

        // Usar a nova rota de cadastro completo
        const response = await fetch("/api/cadastro-completo-familiar-contratante", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            alert(result.error || "Erro ao realizar cadastro completo.");
            return;
        }

        alert("Cadastro completo! Familiar, dependente e cuidador registrados com sucesso.\n\nO cuidador receberá um e-mail com instruções para ativar a conta.");
        
        // Salvar informações do usuário no localStorage antes de limpar
        localStorage.setItem("usuarioNome", familiarData.nome);
        localStorage.setItem("usuarioTipo", "familiar_contratante");
        localStorage.setItem("usuarioId", result.ids.familiar);
        
        // Limpar dados temporários de cadastro
        localStorage.removeItem('dadosFamiliar');
        localStorage.removeItem('dadosDependente');
        localStorage.removeItem('dadosCuidador');
        
        window.location.href = "/dashboard_supervisor";

    } catch (err) {
        console.error("Erro no cadastro:", err);
        alert("Erro ao conectar com o servidor durante o cadastro.");
    } finally {
        finalizeBtn.classList.remove("loading");
        finalizeBtn.disabled = false;
        finalizeBtn.innerHTML = '<i class="fas fa-check"></i> Finalizar Cadastro';
    }
}

// ====================== Força da senha ====================== //

function setupPasswordStrength() {
    const passwordInput = document.getElementById("password");
    const passwordStrength = document.querySelector(".password-strength");
    const strengthBar = document.querySelector(".strength-bar");

    if (passwordInput && passwordStrength && strengthBar) {
        passwordInput.addEventListener("input", function() {
            const password = this.value;
            let strength = "";
            let strengthValue = 0;
            let color = "#E63946";

            if (password.length === 0) {
                strength = "";
                passwordStrength.style.display = "none";
                strengthBar.style.width = "0%";
            } else if (password.length < 8) {
                strength = "Senha fraca";
                strengthValue = 33;
                passwordStrength.style.display = "block";
                passwordStrength.style.color = color;
                strengthBar.style.width = "33%";
                strengthBar.style.backgroundColor = color;
            } else if (password.length < 12) {
                strength = "Senha média";
                strengthValue = 66;
                color = "#F39C12";
                passwordStrength.style.display = "block";
                passwordStrength.style.color = color;
                strengthBar.style.width = "66%";
                strengthBar.style.backgroundColor = color;
            } else {
                strength = "Senha forte";
                strengthValue = 100;
                color = "#27AE60";
                passwordStrength.style.display = "block";
                passwordStrength.style.color = color;
                strengthBar.style.width = "100%";
                strengthBar.style.backgroundColor = color;
            }

            const hasNumbers = /\d/.test(password);
            const hasLetters = /[a-zA-Z]/.test(password);
            
            if (hasNumbers && hasLetters && password.length >= 8) {
                strengthValue += 10;
                strengthBar.style.width = Math.min(strengthValue, 100) + "%";
            }

            passwordStrength.textContent = strength;
        });
    }
}

// ====================== Toggle de senha ====================== //

function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    setupPasswordStrength();
}

// ====================== Preview de imagem ====================== //

function setupImagePreview() {
    const fotoDependenteInput = document.getElementById('fotoDependente');
    const fotoPreviewDiv = document.getElementById('fotoPreview');

    if (fotoDependenteInput && fotoPreviewDiv) {
        fotoDependenteInput.addEventListener('change', function() {
            fotoPreviewDiv.innerHTML = '';
            
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '200px';
                    img.style.maxHeight = '200px';
                    img.style.borderRadius = '8px';
                    fotoPreviewDiv.appendChild(img);
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

// ====================== Máscaras de input ====================== //

function setupMasks() {
    // Máscara de telefone
    const telefoneInputs = document.querySelectorAll('input[type="tel"]');
    telefoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 10) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else {
                value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
            e.target.value = value;
        });
    });

    // Máscara de CPF
    const cpfInput = document.getElementById('cpfCuidador');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }
}

// ====================== Funções auxiliares ====================== //

function formatarData(dataString) {
    if (!dataString) return 'Não informada';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function formatarParentesco(parentesco) {
    const parentescos = {
        'filho': 'Filho(a)',
        'conjuge': 'Cônjuge',
        'pai': 'Pai/Mãe',
        'irmao': 'Irmão/Irmã',
        'neto': 'Neto(a)',
        'sobrinho': 'Sobrinho(a)',
        'outro': 'Outro'
    };
    return parentescos[parentesco] || parentesco;
}

function formatarGenero(genero) {
    const generos = {
        'masculino': 'Masculino',
        'feminino': 'Feminino',
        'outro': 'Outro'
    };
    return generos[genero] || genero || 'Não informado';
}

function formatarEspecializacao(especializacao) {
    const especializacoes = {
        'enfermagem': 'Enfermagem',
        'geriatria': 'Geriatria',
        'cuidador_idosos': 'Cuidador de Idosos',
        'cuidador_criancas': 'Cuidador de Crianças',
        'tec_enfermagem': 'Técnico de Enfermagem',
        'outro': 'Outro'
    };
    return especializacoes[especializacao] || especializacao;
}

function formatarDisponibilidade(disponibilidade) {
    const disponibilidades = {
        'periodo_integral': 'Período Integral',
        'manha': 'Manhã',
        'tarde': 'Tarde',
        'noite': 'Noite',
        'plantao': 'Plantão'
    };
    return disponibilidades[disponibilidade] || disponibilidade;
}

function gerarSenhaTemporaria() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let senha = '';
    for (let i = 0; i < 8; i++) {
        senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return senha;
}

// ====================== Validações ====================== //

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (digito1 !== parseInt(cpf.charAt(9))) {
        return false;
    }
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return digito2 === parseInt(cpf.charAt(10));
}

// ====================== Funções globais ====================== //

// Torna as funções disponíveis globalmente para os eventos onclick no HTML
window.nextStep = nextStep;
window.previousStep = previousStep;
window.finalizarCadastro = finalizarCadastro;