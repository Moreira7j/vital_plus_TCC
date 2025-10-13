// Inicialização dos ícones
document.addEventListener("DOMContentLoaded", function () {
    feather.replace();
    
    // Inicializar funcionalidades
    initDropdown();
    initViewToggle();
    initFilters();
    initMedicamentoActions();
});

// Dropdown do usuário
function initDropdown() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-item')) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
}

// Alternar entre visualização em grade e lista
function initViewToggle() {
    const viewButtons = document.querySelectorAll('.view-options .btn');
    const medicamentosView = document.getElementById('medicamentosView');

    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewType = this.getAttribute('data-view');
            
            // Atualizar botões ativos
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Alternar visualização
            if (viewType === 'list') {
                medicamentosView.classList.add('list-view');
            } else {
                medicamentosView.classList.remove('list-view');
            }
            
            // Salvar preferência
            localStorage.setItem('medicamentosView', viewType);
        });
    });
    
    // Carregar preferência salva
    const savedView = localStorage.getItem('medicamentosView');
    if (savedView === 'list') {
        document.querySelector('[data-view="list"]').click();
    }
}

// Filtros de medicamentos
function initFilters() {
    const aplicarFiltrosBtn = document.getElementById('aplicarFiltros');
    
    if (aplicarFiltrosBtn) {
        aplicarFiltrosBtn.addEventListener('click', function() {
            const status = document.getElementById('filtroStatus').value;
            const categoria = document.getElementById('filtroCategoria').value;
            const busca = document.getElementById('filtroBusca').value.toLowerCase();
            
            const medicamentos = document.querySelectorAll('.medicamento-card');
            
            medicamentos.forEach(medicamento => {
                let show = true;
                const nome = medicamento.querySelector('h4').textContent.toLowerCase();
                const statusElement = medicamento.querySelector('.detail-item:last-child span');
                const statusMedicamento = statusElement ? statusElement.textContent.toLowerCase() : '';
                
                // Aplicar filtros
                if (status !== 'todos' && !statusMedicamento.includes(status)) {
                    show = false;
                }
                
                if (busca && !nome.includes(busca)) {
                    show = false;
                }
                
                // Mostrar/ocultar com animação
                if (show) {
                    medicamento.style.display = '';
                    setTimeout(() => {
                        medicamento.style.opacity = '1';
                        medicamento.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    medicamento.style.opacity = '0';
                    medicamento.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        medicamento.style.display = 'none';
                    }, 300);
                }
            });
            
            // Feedback visual
            this.innerHTML = '<i data-feather="filter"></i> Filtros Aplicados';
            feather.replace();
            
            setTimeout(() => {
                this.innerHTML = '<i data-feather="filter"></i> Aplicar Filtros';
                feather.replace();
            }, 2000);
        });
    }
}

// Ações dos medicamentos
function initMedicamentoActions() {
    // Botão de novo medicamento
    const novoMedicamentoBtn = document.getElementById('novoMedicamentoBtn');
    if (novoMedicamentoBtn) {
        novoMedicamentoBtn.addEventListener('click', showNovoMedicamentoModal);
    }
    
    // Botões de ação nos cards
    document.addEventListener('click', function(e) {
        // Editar medicamento
        if (e.target.closest('.btn-icon[title="Editar"]')) {
            const card = e.target.closest('.medicamento-card');
            const nome = card.querySelector('h4').textContent;
            editarMedicamento(nome);
        }
        
        // Ver histórico
        if (e.target.closest('.btn-icon[title="Histórico"]')) {
            const card = e.target.closest('.medicamento-card');
            const nome = card.querySelector('h4').textContent;
            verHistorico(nome);
        }
        
        // Registrar dose
        if (e.target.closest('.btn') && e.target.closest('.medicamento-footer')) {
            const card = e.target.closest('.medicamento-card');
            const nome = card.querySelector('h4').textContent;
            registrarDose(nome);
        }
    });
}

// Funções de ação
function showNovoMedicamentoModal() {
    // Simulação - implementar modal real
    alert('Funcionalidade de novo medicamento será implementada com um modal');
}

function editarMedicamento(nome) {
    alert(`Editando medicamento: ${nome}`);
    // Implementar lógica de edição
}

function verHistorico(nome) {
    alert(`Visualizando histórico de: ${nome}`);
    // Implementar visualização de histórico
}

function registrarDose(nome) {
    const btn = event.target.closest('.btn');
    const originalText = btn.innerHTML;
    
    // Simular registro
    btn.innerHTML = '<i data-feather="loader" class="spinner"></i> Registrando...';
    feather.replace();
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = '<i data-feather="check"></i> Registrado!';
        feather.replace();
        
        // Atualizar status do medicamento
        const statusElement = btn.closest('.medicamento-card').querySelector('.detail-item:last-child span');
        if (statusElement) {
            statusElement.textContent = 'Administrado';
            statusElement.className = 'badge bg-success';
        }
        
        // Restaurar botão após delay
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            feather.replace();
        }, 2000);
    }, 1500);
}

// Atualizar contagem regressiva para próximas doses
function atualizarContagemRegressiva() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    const agora = new Date();
    
    timelineItems.forEach(item => {
        const timeElement = item.querySelector('.timeline-time');
        const badgeElement = item.querySelector('.badge');
        const timeText = timeElement.textContent;
        
        // Simulação - implementar lógica real de contagem regressiva
        if (timeText === '13:30' && badgeElement) {
            badgeElement.textContent = 'Em 2 horas';
        }
    });
}

// Iniciar atualização periódica
setInterval(atualizarContagemRegressiva, 60000); // Atualizar a cada minuto