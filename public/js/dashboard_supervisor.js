// dashboard_supervisor.js - CORRIGIDO (problema de paciente selecionado)

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM carregado, inicializando dashboard supervisor...');

    // DEBUG: Verificar localStorage completo
    console.log('🔍 DEBUG - localStorage completo:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`📦 ${key}:`, value);
    }

    // Inicializar ícones do Feather
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Carregar dados do dependente
    carregarDadosDependente();

    // Configurar eventos
    configurarEventos();

    console.log('🎯 Dashboard supervisor inicializado com sucesso!');
});

// Função para carregar dados do dependente - CORREÇÃO COMPLETA
async function carregarDadosDependente() {
    try {
        console.log('🔍 Iniciando carregamento de dados do dependente...');

        // Recuperar dados do usuário
        const usuarioId = localStorage.getItem('usuarioId');
        const usuarioTipo = localStorage.getItem('usuarioTipo');
        
        // ✅ CORREÇÃO: Verificar TODAS as possíveis chaves de paciente selecionado
        let pacienteSelecionadoId = 
            localStorage.getItem('pacienteSelecionadoId') || 
            localStorage.getItem('dependenteSelecionadoId') ||
            (() => {
                // Tentar extrair de objeto JSON
                const dependenteObj = localStorage.getItem('dependenteSelecionado');
                if (dependenteObj) {
                    try {
                        const obj = JSON.parse(dependenteObj);
                        return obj.id || obj.paciente_id;
                    } catch (e) {
                        return null;
                    }
                }
                return null;
            })();

        console.log('👤 Usuário:', usuarioId, 'Tipo:', usuarioTipo);
        console.log('🎯 Paciente selecionado ID:', pacienteSelecionadoId);

        if (!usuarioId) {
            console.error('❌ Usuário não logado');
            window.location.href = '/';
            return;
        }

        if (!pacienteSelecionadoId) {
            console.error('❌ Nenhum paciente selecionado encontrado no localStorage');
            
            // Listar todas as chaves disponíveis para debug
            console.log('🔍 Chaves disponíveis no localStorage:');
            for (let i = 0; i < localStorage.length; i++) {
                console.log(`   - ${localStorage.key(i)}`);
            }
            
            mostrarErro('Nenhum paciente selecionado. Por favor, selecione um paciente primeiro.');
            setTimeout(() => {
                window.location.href = 'dependentes.html';
            }, 3000);
            return;
        }

        // ✅ CORREÇÃO: Buscar dados do paciente usando a rota CORRETA
        let paciente;
        if (usuarioTipo === 'familiar_contratante' || usuarioTipo === 'familiar_cuidador') {
            // Usar rota do SUPERVISOR
            console.log('🌐 Buscando dados do paciente via rota supervisor...');
            const response = await fetch(`/api/supervisores/${usuarioId}/paciente/${pacienteSelecionadoId}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta da API:', response.status, errorText);
                
                if (response.status === 404) {
                    mostrarErro('Paciente não encontrado. Por favor, selecione outro paciente.');
                    setTimeout(() => {
                        window.location.href = 'dependentes.html';
                    }, 3000);
                    return;
                }
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }
            
            paciente = await response.json();
        } else {
            // Para outros tipos, usar rota genérica
            const response = await fetch(`/api/dependentes/${pacienteSelecionadoId}`);
            if (!response.ok) throw new Error('Erro ao carregar paciente');
            paciente = await response.json();
        }

        console.log('✅ Dados do paciente recebidos:', paciente);

        // ✅ CORREÇÃO: Garantir que o paciente está salvo em TODOS os formatos para compatibilidade
        localStorage.setItem('pacienteSelecionadoId', paciente.id);
        localStorage.setItem('dependenteSelecionado', JSON.stringify(paciente));

        // Atualizar interface
        atualizarInterfaceDependente(paciente);

        // Carregar dados adicionais
        console.log('🔄 Carregando dados adicionais...');
        await carregarDadosAdicionais(usuarioId, paciente.id);

        console.log('✅ Todos os dados carregados com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao carregar dados do dependente:', error);
        mostrarErro('Erro ao carregar dados: ' + error.message);
    }
}

// Função para carregar dados adicionais
async function carregarDadosAdicionais(usuarioId, pacienteId) {
    try {
        await Promise.all([
            carregarSinaisVitais(usuarioId, pacienteId),
            carregarAtividades(usuarioId, pacienteId),
            carregarAlertas(usuarioId, pacienteId),
            carregarMedicamentos(usuarioId, pacienteId)
        ]);
    } catch (error) {
        console.error('❌ Erro ao carregar dados adicionais:', error);
    }
}

// Função para atualizar a interface - MANTIDA (já está correta)
function atualizarInterfaceDependente(paciente) {
    console.log('🎨 Atualizando interface para paciente:', paciente);

    // Elementos principais
    const elementos = {
        'dependenteNome': paciente.nome || 'Nome não informado',
        'dependenteIdade': (paciente.idade || calcularIdade(paciente.data_nascimento)) + ' anos',
        'dependenteCondicao': paciente.condicao_principal || 'Condição não informada',
        'healthPlan': paciente.plano_saude || 'Não informado',
        'patientAllergies': paciente.alergias || 'Nenhuma alergia informada'
    };

    // Atualizar elementos textuais
    Object.keys(elementos).forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = elementos[id];
            console.log(`✅ ${id} atualizado:`, elementos[id]);
        }
    });

    // Informações do cuidador
    if (paciente.cuidador_nome) {
        const cuidadorNome = document.getElementById('cuidadorNome');
        const cuidadorContato = document.getElementById('cuidadorContato');
        const cuidadorEspecializacao = document.getElementById('cuidadorEspecializacao');
        
        if (cuidadorNome) cuidadorNome.textContent = paciente.cuidador_nome;
        if (cuidadorContato) cuidadorContato.textContent = paciente.cuidador_telefone || 'Contato não informado';
        if (cuidadorEspecializacao) cuidadorEspecializacao.textContent = paciente.cuidador_especializacao || 'Especialização não informada';
    }

    // Informações do familiar
    const familiarName = document.getElementById('familiarName');
    if (familiarName && paciente.familiar_nome) {
        familiarName.textContent = paciente.familiar_nome;
    }

    // Foto do dependente
    const fotoElement = document.getElementById('dependenteFoto') || document.getElementById('patientAvatar');
    if (fotoElement) {
        let fotoUrl = paciente.foto_url || paciente.foto_perfil;
        
        if (fotoUrl && fotoUrl !== 'null' && fotoUrl !== 'undefined') {
            if (!fotoUrl.startsWith('http') && !fotoUrl.startsWith('/')) {
                fotoUrl = '/' + fotoUrl;
            }
            
            console.log('🖼️ Tentando carregar foto:', fotoUrl);
            fotoElement.src = fotoUrl;

            fotoElement.onerror = function () {
                console.error('❌ Erro ao carregar imagem, usando padrão:', fotoUrl);
                this.src = '../assets/default-avatar.png';
                this.alt = 'Foto não disponível';
            };

            fotoElement.onload = function () {
                console.log('✅ Foto carregada com sucesso:', fotoUrl);
            };
        } else {
            console.log('📸 Usando foto padrão');
            fotoElement.src = '../assets/default-avatar.png';
            fotoElement.alt = 'Foto padrão';
        }
    }

    // Atualizar timestamp
    const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');
    if (ultimaAtualizacao) {
        ultimaAtualizacao.textContent = new Date().toLocaleString('pt-BR');
    }
}

// Funções para carregar dados adicionais - MANTIDAS (já estão corretas)
async function carregarSinaisVitais(usuarioId, pacienteId) {
    try {
        console.log('💓 Carregando sinais vitais...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/sinais-vitais`);

        if (response.ok) {
            const sinais = await response.json();
            console.log('✅ Sinais vitais recebidos:', sinais);
            atualizarSinaisVitais(sinais);
        } else {
            console.log('⚠️ API de sinais vitais não respondeu');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar sinais vitais:', error);
    }
}

async function carregarMedicamentos(usuarioId, pacienteId) {
    try {
        console.log('💊 Carregando medicamentos...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/medicamentos`);

        if (response.ok) {
            const medicamentos = await response.json();
            console.log('✅ Medicamentos recebidos:', medicamentos.length);
            atualizarMedicamentos(medicamentos);
        } else {
            console.log('⚠️ API de medicamentos não respondeu');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar medicamentos:', error);
    }
}

async function carregarAtividades(usuarioId, pacienteId) {
    try {
        console.log('📅 Carregando atividades...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/atividades`);

        if (response.ok) {
            const atividades = await response.json();
            console.log('✅ Atividades recebidas:', atividades.length);
            exibirAtividades(atividades);
        } else {
            console.log('⚠️ API de atividades não respondeu');
            exibirAtividades([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar atividades:', error);
        exibirAtividades([]);
    }
}

async function carregarAlertas(usuarioId, pacienteId) {
    try {
        console.log('🚨 Carregando alertas...');
        const response = await fetch(`/api/supervisores/${usuarioId}/pacientes/${pacienteId}/alertas`);

        if (response.ok) {
            const alertas = await response.json();
            console.log('✅ Alertas recebidos:', alertas.length);
            exibirAlertas(alertas);
        } else {
            console.log('⚠️ API de alertas não respondeu');
            exibirAlertas([]);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar alertas:', error);
        exibirAlertas([]);
    }
}

// Funções de atualização da interface - MANTIDAS (já estão corretas)
function atualizarSinaisVitais(sinais) {
    console.log('📊 Atualizando sinais vitais na interface:', sinais);

    if (!sinais || sinais.length === 0) {
        console.log('📋 Nenhum sinal vital disponível');
        return;
    }

    sinais.forEach(sinal => {
        if (!sinal.tipo) return;

        switch (sinal.tipo.toLowerCase()) {
            case 'pressao_arterial':
                atualizarElemento('pressaoMedia', `${sinal.valor_principal || '--'}/${sinal.valor_secundario || '--'}`);
                atualizarStatus('pressaoStatus', avaliarPressao(sinal));
                break;

            case 'glicemia':
                atualizarElemento('glicemiaMedia', sinal.valor_principal || '--');
                atualizarStatus('glicemiaStatus', avaliarGlicemia(sinal));
                break;

            case 'temperatura':
                atualizarElemento('temperaturaMedia', sinal.valor_principal || '--');
                atualizarStatus('temperaturaStatus', avaliarTemperatura(sinal));
                break;

            case 'batimentos_cardiacos':
                atualizarElemento('heartRate', sinal.valor_principal || '--');
                atualizarStatus('hrStatus', avaliarBatimentos(sinal));
                break;
        }
    });

    atualizarStatusGeral(sinais);
}

function atualizarMedicamentos(medicamentos) {
    const container = document.getElementById('medicationSchedule');
    if (!container) return;

    if (!medicamentos || medicamentos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-feather="calendar"></i>
                <p>Nenhum medicamento cadastrado</p>
            </div>
        `;
        feather.replace();
        return;
    }

    container.innerHTML = medicamentos.map(med => `
        <div class="medication-item">
            <div class="medication-icon">
                <i data-feather="pill"></i>
            </div>
            <div class="medication-info">
                <h5>${med.nome_medicamento}</h5>
                <small>${med.dosagem} - ${med.horarios || 'Horário não definido'}</small>
            </div>
        </div>
    `).join('');

    feather.replace();
}

function exibirAtividades(atividades) {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;

    if (!atividades || atividades.length === 0) {
        activityFeed.innerHTML = `
            <div class="empty-state">
                <i data-feather="clock"></i>
                <p>Nenhuma atividade recente</p>
            </div>
        `;
        feather.replace();
        return;
    }

    const atividadesHTML = atividades.map(atividade => `
        <div class="activity-item">
            <div class="activity-icon ${atividade.tipo || 'default'}">
                <i data-feather="${obterIconeAtividade(atividade.tipo)}"></i>
            </div>
            <div class="activity-content">
                <h5>${atividade.descricao || 'Atividade'}</h5>
                <p>Por: ${atividade.cuidador_nome || 'Cuidador'}</p>
                <small class="activity-time">${formatarData(atividade.data_prevista || atividade.data_criacao)}</small>
                <span class="badge ${atividade.status === 'concluida' ? 'bg-success' : 'bg-warning'}">
                    ${atividade.status === 'concluida' ? 'Concluída' : 'Pendente'}
                </span>
            </div>
        </div>
    `).join('');

    activityFeed.innerHTML = atividadesHTML;
    feather.replace();
}

function exibirAlertas(alertas) {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;

    if (!alertas || alertas.length === 0) {
        alertsList.innerHTML = `
            <div class="empty-state">
                <i data-feather="bell-off"></i>
                <p>Nenhum alerta no momento</p>
            </div>
        `;
        feather.replace();
        return;
    }

    const alertasHTML = alertas.map(alerta => `
        <div class="alert-item ${alerta.severidade || 'media'}">
            <i data-feather="${obterIconeAlerta(alerta.severidade)}" class="alert-icon"></i>
            <div class="alert-content">
                <h5>${alerta.titulo || 'Alerta'}</h5>
                <p>${alerta.descricao || 'Descrição não disponível'}</p>
                <small class="alert-time">${formatarData(alerta.data_criacao)}</small>
            </div>
        </div>
    `).join('');

    alertsList.innerHTML = alertasHTML;
    feather.replace();
}

// FUNÇÃO CONFIGURAR EVENTOS - MANTIDA (já está correta)
function configurarEventos() {
    console.log('⚙️ Configurando eventos...');

    // Filtro de período
    const periodoFilter = document.getElementById('periodoFilter');
    if (periodoFilter) {
        periodoFilter.addEventListener('change', function () {
            const usuarioId = localStorage.getItem('usuarioId');
            const pacienteId = localStorage.getItem('pacienteSelecionadoId');
            if (usuarioId && pacienteId) {
                carregarAtividades(usuarioId, pacienteId);
            }
        });
    }

    // Botão de atualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            carregarDadosDependente();
        });
    }

    // Links de navegação
    const links = {
        'relatoriosLink': 'relatorios_supervisor.html',
        'alertasLink': 'alertas_supervisor.html', 
        'comunicacaoLink': 'comunicacao_supervisor.html'
    };

    Object.keys(links).forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = links[linkId];
            });
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/";
        });
    }
}

// FUNÇÕES AUXILIARES - MANTIDAS (já estão corretas)
function atualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}

function atualizarStatus(id, status) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.textContent = status;
        elemento.className = `badge ${obterClasseStatus(status)}`;
    }
}

function obterClasseStatus(status) {
    const statusMap = {
        'Normal': 'bg-success',
        'Estável': 'bg-success',
        'Baixa': 'bg-warning', 
        'Alta': 'bg-warning',
        'Crítico': 'bg-danger'
    };
    return statusMap[status] || 'bg-secondary';
}

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return '--';
    try {
        const nascimento = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade;
    } catch (e) {
        return '--';
    }
}

function avaliarPressao(sinal) {
    const sistolica = parseInt(sinal.valor_principal);
    if (isNaN(sistolica)) return '--';
    if (sistolica < 90) return 'Baixa';
    if (sistolica > 140) return 'Alta';
    return 'Normal';
}

function avaliarGlicemia(sinal) {
    const valor = parseInt(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 70) return 'Baixa';
    if (valor > 180) return 'Alta';
    return 'Normal';
}

function avaliarTemperatura(sinal) {
    const valor = parseFloat(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 36) return 'Baixa';
    if (valor > 37.5) return 'Alta';
    return 'Normal';
}

function avaliarBatimentos(sinal) {
    const valor = parseInt(sinal.valor_principal);
    if (isNaN(valor)) return '--';
    if (valor < 60) return 'Baixo';
    if (valor > 100) return 'Alto';
    return 'Normal';
}

function atualizarStatusGeral(sinais) {
    const statusElement = document.getElementById('statusGeral');
    if (!statusElement) return;

    let status = 'Estável';
    let classe = 'bg-success';

    const problemas = sinais.filter(sinal => {
        const avaliacao = avaliarPressao(sinal) || avaliarGlicemia(sinal) || avaliarTemperatura(sinal);
        return avaliacao === 'Baixa' || avaliacao === 'Alta' || avaliacao === 'Baixo' || avaliacao === 'Alto';
    });

    if (problemas.length > 0) {
        status = 'Atenção';
        classe = 'bg-warning';
    }

    statusElement.textContent = status;
    statusElement.className = `badge ${classe}`;
}

function obterIconeAtividade(tipo) {
    const icones = {
        'medicacao': 'pill',
        'alimentacao': 'coffee',
        'exercicio': 'activity',
        'banho': 'droplet',
        'consulta': 'calendar',
        'default': 'activity'
    };
    return icones[tipo] || icones.default;
}

function obterIconeAlerta(severidade) {
    const icones = {
        'critica': 'alert-triangle',
        'alta': 'alert-octagon',
        'media': 'alert-circle',
        'baixa': 'info',
        'default': 'bell'
    };
    return icones[severidade] || icones.default;
}

function formatarData(dataString) {
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data não disponível';
    }
}

function mostrarErro(mensagem) {
    console.error('❌ ' + mensagem);
    alert('❌ ' + mensagem);
}

function mostrarSucesso(mensagem) {
    console.log('✅ ' + mensagem);
    alert('✅ ' + mensagem);
}

// Atualizar ícones periodicamente
setInterval(() => {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}, 2000);