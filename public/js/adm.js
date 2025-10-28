// admin.js - Painel Administrativo Vital+

class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.stats = {};
        this.charts = {};
        this.init();
    }

    async init() {
        await this.verifyAdminAccess();
        this.setupEventListeners();
        this.loadDashboardData();
        this.updateSystemInfo();
        
        // Atualizar informações a cada 30 segundos
        setInterval(() => this.updateSystemInfo(), 30000);
    }

    async verifyAdminAccess() {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');
        
        if (!usuarioLogado || usuarioLogado.tipo !== 'admin') {
            this.showError('Acesso restrito a administradores');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
            return;
        }

        this.currentUser = usuarioLogado;
        document.getElementById('adminName').textContent = usuarioLogado.nome;
    }

    setupEventListeners() {
        // Navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Filtros
        document.getElementById('userSearch')?.addEventListener('input', 
            this.debounce(() => this.loadUsers(), 300));
        
        document.getElementById('userTypeFilter')?.addEventListener('change', 
            () => this.loadUsers());

        // Modais
        document.getElementById('addUserBtn')?.addEventListener('click', 
            () => this.openUserModal());

        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Notificações
        document.getElementById('notificationsBtn')?.addEventListener('click',
            () => this.toggleNotifications());

        // Configurações
        this.setupSettingsListeners();
    }

    switchSection(sectionId) {
        // Atualizar navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Mostrar seção
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Carregar dados específicos da seção
        this.loadSectionData(sectionId);
    }

    async loadSectionData(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'usuarios':
                await this.loadUsers();
                break;
            case 'cuidadores':
                await this.loadCuidadores();
                break;
            case 'pacientes':
                await this.loadPacientes();
                break;
            case 'relatorios':
                await this.loadRelatorios();
                break;
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/admin/dashboard');
            if (!response.ok) throw new Error('Erro ao carregar dashboard');
            
            const data = await response.json();
            this.stats = data;
            this.updateStatsCards();
            this.initCharts();
            this.loadRecentActivity();
            
        } catch (error) {
            this.showError('Erro ao carregar dados do dashboard');
            console.error('Dashboard error:', error);
        }
    }

    updateStatsCards() {
        const stats = this.stats;
        
        // Atualizar cards de estatísticas
        document.getElementById('totalUsuarios').textContent = stats.totalUsuarios || 0;
        document.getElementById('totalCuidadores').textContent = stats.totalCuidadores || 0;
        document.getElementById('totalPacientes').textContent = stats.totalPacientes || 0;
        document.getElementById('totalAlertas').textContent = stats.alertasHoje || 0;

        // Atualizar variações
        document.getElementById('usuariosVariacao').textContent = 
            `${stats.usuariosVariacao || 0}%`;
        document.getElementById('cuidadoresVariacao').textContent = 
            `${stats.cuidadoresVariacao || 0}%`;
        document.getElementById('pacientesVariacao').textContent = 
            `${stats.pacientesVariacao || 0}%`;
        document.getElementById('alertasVariacao').textContent = 
            `${stats.alertasVariacao || 0}%`;
    }

    initCharts() {
        this.initActivityChart();
        this.initUsersChart();
        this.initMetricsChart();
    }

    initActivityChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        this.charts.activity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.stats.activityLabels || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Atividade',
                    data: this.stats.activityData || [65, 59, 80, 81, 56, 55, 40],
                    borderColor: '#00B5C2',
                    backgroundColor: 'rgba(0, 181, 194, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    initUsersChart() {
        const ctx = document.getElementById('usersChart').getContext('2d');
        
        if (this.charts.users) {
            this.charts.users.destroy();
        }

        this.charts.users = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Familiares', 'Cuidadores', 'Administradores'],
                datasets: [{
                    data: this.stats.usersDistribution || [40, 35, 25],
                    backgroundColor: [
                        '#00B5C2',
                        '#4B0082',
                        '#FF6B6B'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initMetricsChart() {
        const ctx = document.getElementById('metricsChart').getContext('2d');
        
        if (this.charts.metrics) {
            this.charts.metrics.destroy();
        }

        this.charts.metrics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [
                    {
                        label: 'Novos Usuários',
                        data: [65, 59, 80, 81, 56, 55],
                        backgroundColor: '#00B5C2'
                    },
                    {
                        label: 'Novos Pacientes',
                        data: [28, 48, 40, 19, 86, 27],
                        backgroundColor: '#4B0082'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async loadUsers(page = 1) {
        try {
            const search = document.getElementById('userSearch').value;
            const typeFilter = document.getElementById('userTypeFilter').value;
            const statusFilter = document.getElementById('userStatusFilter').value;

            const params = new URLSearchParams({
                page,
                search,
                tipo: typeFilter,
                status: statusFilter
            });

            const response = await fetch(`/api/admin/usuarios?${params}`);
            if (!response.ok) throw new Error('Erro ao carregar usuários');
            
            const data = await response.json();
            this.renderUsersTable(data.usuarios);
            this.renderPagination(data.pagination, 'usersPagination', page);
            
        } catch (error) {
            this.showError('Erro ao carregar usuários');
            console.error('Users error:', error);
        }
    }

    renderUsersTable(usuarios) {
        const tbody = document.getElementById('usersTableBody');
        
        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>Nenhum usuário encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = usuarios.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <strong>${user.nome}</strong>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="badge badge-${user.tipo}">
                        ${this.getUserTypeLabel(user.tipo)}
                    </span>
                </td>
                <td>
                    <span class="status status-${user.status}">
                        ${this.getStatusLabel(user.status)}
                    </span>
                </td>
                <td>${new Date(user.data_cadastro).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="actions">
                        <button class="btn-icon" onclick="admin.editUser(${user.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="admin.toggleUserStatus(${user.id})" 
                                title="${user.status === 'ativo' ? 'Desativar' : 'Ativar'}">
                            <i class="fas ${user.status === 'ativo' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="admin.deleteUser(${user.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getUserTypeLabel(tipo) {
        const types = {
            'familiar_contratante': 'Familiar Contratante',
            'familiar_cuidador': 'Familiar Cuidador',
            'cuidador_profissional': 'Cuidador Profissional',
            'admin': 'Administrador'
        };
        return types[tipo] || tipo;
    }

    getStatusLabel(status) {
        const statusMap = {
            'ativo': 'Ativo',
            'inativo': 'Inativo',
            'pendente': 'Pendente'
        };
        return statusMap[status] || status;
    }

    renderPagination(pagination, containerId, currentPage) {
        const container = document.getElementById(containerId);
        if (!container || !pagination) return;

        let html = '';
        
        if (pagination.prev) {
            html += `<button onclick="admin.loadUsers(${pagination.prev})">Anterior</button>`;
        }

        for (let i = 1; i <= pagination.pages; i++) {
            html += `<button class="${i === currentPage ? 'active' : ''}" 
                            onclick="admin.loadUsers(${i})">${i}</button>`;
        }

        if (pagination.next) {
            html += `<button onclick="admin.loadUsers(${pagination.next})">Próxima</button>`;
        }

        container.innerHTML = html;
    }

    async loadCuidadores() {
        try {
            const response = await fetch('/api/admin/cuidadores');
            if (!response.ok) throw new Error('Erro ao carregar cuidadores');
            
            const data = await response.json();
            this.renderCuidadoresGrid(data.cuidadores);
            
        } catch (error) {
            this.showError('Erro ao carregar cuidadores');
            console.error('Cuidadores error:', error);
        }
    }

    renderCuidadoresGrid(cuidadores) {
        const grid = document.getElementById('cuidadoresGrid');
        
        if (!cuidadores || cuidadores.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-nurse"></i>
                    <p>Nenhum cuidador cadastrado</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = cuidadores.map(cuidador => `
            <div class="stat-card">
                <div class="stat-icon nurses">
                    <i class="fas fa-user-nurse"></i>
                </div>
                <div class="stat-info">
                    <h3>${cuidador.nome}</h3>
                    <span>${cuidador.especializacao || 'Cuidador Profissional'}</span>
                    <div class="stat-trend ${cuidador.status === 'ativo' ? 'up' : 'down'}">
                        <i class="fas fa-circle"></i>
                        <span>${this.getStatusLabel(cuidador.status)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadPacientes() {
        try {
            const response = await fetch('/api/admin/pacientes');
            if (!response.ok) throw new Error('Erro ao carregar pacientes');
            
            const data = await response.json();
            this.renderPacientesTable(data.pacientes);
            
        } catch (error) {
            this.showError('Erro ao carregar pacientes');
            console.error('Pacientes error:', error);
        }
    }

    renderPacientesTable(pacientes) {
        const tbody = document.getElementById('pacientesTableBody');
        
        if (!pacientes || pacientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-user-injured"></i>
                        <p>Nenhum paciente encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pacientes.map(paciente => `
            <tr>
                <td>
                    <div class="user-info">
                        <strong>${paciente.nome}</strong>
                    </div>
                </td>
                <td>${paciente.idade} anos</td>
                <td>${paciente.condicao_principal || 'Não informada'}</td>
                <td>${paciente.cuidador_nome || 'Não atribuído'}</td>
                <td>
                    <span class="status status-${paciente.status_saude || 'estavel'}">
                        ${this.getStatusLabel(paciente.status_saude || 'estavel')}
                    </span>
                </td>
                <td>${new Date(paciente.ultima_atualizacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="actions">
                        <button class="btn-icon" onclick="admin.viewPaciente(${paciente.id})" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="admin.editPaciente(${paciente.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadRelatorios() {
        // Dados dos relatórios são carregados estaticamente
        console.log('Relatórios carregados');
    }

    loadRecentActivity() {
        const activityList = document.getElementById('recentActivity');
        const activities = this.stats.recentActivity || [];
        
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.tipo)}"></i>
                </div>
                <div class="activity-content">
                    <h5>${activity.titulo}</h5>
                    <p>${activity.descricao}</p>
                </div>
                <div class="activity-time">
                    ${new Date(activity.data).toLocaleDateString('pt-BR')}
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(tipo) {
        const icons = {
            'user': 'user-plus',
            'alert': 'bell',
            'system': 'cog',
            'health': 'heartbeat'
        };
        return icons[tipo] || 'circle';
    }

    openUserModal(userId = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm');
        
        if (userId) {
            title.textContent = 'Editar Usuário';
            // Carregar dados do usuário
            this.loadUserData(userId);
        } else {
            title.textContent = 'Novo Usuário';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    setupSettingsListeners() {
        // Configurações de notificação
        document.getElementById('emailNotifications')?.addEventListener('change', 
            (e) => this.saveSetting('email_notifications', e.target.checked));
        
        document.getElementById('pushNotifications')?.addEventListener('change',
            (e) => this.saveSetting('push_notifications', e.target.checked));

        // Tema
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.changeTheme(option.dataset.theme);
            });
        });
    }

    async saveSetting(key, value) {
        try {
            await fetch('/api/admin/configuracoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key, value })
            });
            this.showSuccess('Configuração salva com sucesso');
        } catch (error) {
            this.showError('Erro ao salvar configuração');
        }
    }

    changeTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('admin_theme', theme);
    }

    updateSystemInfo() {
        // Atualizar hora do servidor
        document.getElementById('serverTime').textContent = 
            new Date().toLocaleTimeString('pt-BR');
        
        // Atualizar status do sistema
        this.checkSystemStatus();
    }

    async checkSystemStatus() {
        try {
            const response = await fetch('/api/admin/status');
            const data = await response.json();
            
            const statusElement = document.getElementById('systemStatus');
            if (data.status === 'online') {
                statusElement.className = 'status-online';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Sistema Online';
            } else {
                statusElement.className = 'status-offline';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> Sistema Offline';
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    }

    // Utilitários
    debounce(func, wait) {
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

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Implementar sistema de notificações
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    // Métodos para ações (serão implementados)
    editUser(userId) {
        this.openUserModal(userId);
    }

    async toggleUserStatus(userId) {
        try {
            const response = await fetch(`/api/admin/usuarios/${userId}/toggle-status`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showSuccess('Status do usuário atualizado');
                this.loadUsers();
            } else {
                throw new Error('Erro ao alterar status');
            }
        } catch (error) {
            this.showError('Erro ao alterar status do usuário');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        
        try {
            const response = await fetch(`/api/admin/usuarios/${userId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.showSuccess('Usuário excluído com sucesso');
                this.loadUsers();
            } else {
                throw new Error('Erro ao excluir usuário');
            }
        } catch (error) {
            this.showError('Erro ao excluir usuário');
        }
    }

    viewPaciente(pacienteId) {
        // Implementar visualização de paciente
        console.log('Visualizar paciente:', pacienteId);
    }

    editPaciente(pacienteId) {
        // Implementar edição de paciente
        console.log('Editar paciente:', pacienteId);
    }
}

// Funções globais
function sair() {
    localStorage.clear();
    window.location.href = '/';
}

function gerarRelatorio(tipo) {
    // Implementar geração de relatórios
    console.log('Gerar relatório:', tipo);
}

function alterarSenha() {
    // Implementar alteração de senha
    console.log('Alterar senha');
}

function gerarBackup() {
    // Implementar backup
    console.log('Gerar backup');
}

function verLogs() {
    // Implementar visualização de logs
    console.log('Ver logs');
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});