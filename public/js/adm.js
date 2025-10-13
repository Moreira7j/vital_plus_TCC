// Inicializar feather icons
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    
    // Inicializar gráficos
    initCharts();
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadDashboardData();
});

// Inicializar gráficos
function initCharts() {
    // Gráfico de atividade de usuários
    const userActivityCtx = document.getElementById('userActivityChart').getContext('2d');
    new Chart(userActivityCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
            datasets: [{
                label: 'Novos Usuários',
                data: [65, 59, 80, 81, 56, 55, 72],
                borderColor: '#00B5C2',
                backgroundColor: 'rgba(0, 181, 194, 0.1)',
                tension: 0.3,
                fill: true
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

    // Gráfico de distribuição de dependentes
    const dependentsCtx = document.getElementById('dependentsChart').getContext('2d');
    new Chart(dependentsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Idosos', 'Adultos', 'Crianças'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: [
                    '#00B5C2',
                    '#4B0082',
                    '#20C997'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });
}

// Configurar navegação
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe active de todos os links
            navLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            
            // Adicionar classe active ao link clicado
            this.parentElement.classList.add('active');
            
            // Mostrar seção correspondente
            const targetId = this.getAttribute('href').substring(1);
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Toggle sidebar em mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Fechar sidebar ao clicar fora (mobile)
    document.addEventListener('click', function(e) {
        if (window.innerWidth < 768 && 
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
    
    // Filtro de gráfico
    const chartFilter = document.querySelector('.chart-filter');
    if (chartFilter) {
        chartFilter.addEventListener('change', function() {
            // Aqui você recarregaria os dados do gráfico baseado no filtro
            console.log('Filtro alterado:', this.value);
        });
    }
    
    // Notificações
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            alert('Sistema de notificações será implementado aqui!');
        });
    }
}

// Carregar dados do dashboard
function loadDashboardData() {
    // Simular carregamento de dados
    console.log('Carregando dados do dashboard...');
    
    // Em uma aplicação real, você faria requisições AJAX aqui
    setTimeout(() => {
        console.log('Dados do dashboard carregados!');
    }, 1000);
}

// Funções para outras seções (serão implementadas)
function loadUsers() {
    console.log('Carregando usuários...');
}

function loadDependents() {
    console.log('Carregando dependentes...');
}

function loadMedications() {
    console.log('Carregando medicamentos...');
}

function loadAlerts() {
    console.log('Carregando alertas...');
}

function loadReports() {
    console.log('Carregando relatórios...');
}

function loadSettings() {
    console.log('Carregando configurações...');
}

// Função para logout
function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Redirecionar para página de login
        window.location.href = 'login.html';
    }
}

// Adicionar evento de logout
document.querySelector('.logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    logout();
});

// Exportar funções para uso global
window.adminApp = {
    initCharts,
    loadDashboardData,
    loadUsers,
    loadDependents,
    loadMedications,
    loadAlerts,
    loadReports,
    loadSettings,
    logout
};