// Função para mostrar mensagens
function mostrarMensagem(mensagem, tipo = 'success') {
    const toastContainer = document.getElementById('toast-container') || criarToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo} toast-slide-in`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-header">
                <div class="toast-icon">
                    ${getIcon(tipo)}
                </div>
                <div class="toast-title">
                    ${getTitle(tipo)}
                </div>
                <button class="toast-close" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div>${mensagem}</div>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Remove após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-slide-out');
            setTimeout(() => toast.remove(), 500);
        }
    }, 5000);
}

// Funções auxiliares
function criarToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getIcon(tipo) {
    const icons = {
        'success': '<i class="fas fa-check-circle"></i>',
        'warning': '<i class="fas fa-exclamation-triangle"></i>',
        'error': '<i class="fas fa-exclamation-circle"></i>',
        'info': '<i class="fas fa-info-circle"></i>'
    };
    return icons[tipo] || icons['info'];
}

function getTitle(tipo) {
    const titles = {
        'success': 'Sucesso',
        'warning': 'Aviso',
        'error': 'Erro',
        'info': 'Informação'
    };
    return titles[tipo] || 'Mensagem';
}

// Elementos DOM
const modalOverlay = document.getElementById('modalOverlay');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveDocBtn = document.getElementById('saveDocBtn');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const docForm = document.getElementById('documentForm');
const documentsTableBody = document.getElementById('documentsTableBody');
const emptyRow = document.getElementById('emptyRow');
const totalDocsElement = document.getElementById('totalDocs');
const expiredDocsElement = document.getElementById('expiredDocs');
const warningDocsElement = document.getElementById('warningDocs');

// Inicialização
document.addEventListener('DOMContentLoaded', function () {

    // Adicionar event listeners
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Abrir modal
    openModalBtn.addEventListener('click', openModal);

    // Fechar modal
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Upload de arquivo
    fileUploadArea.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName.textContent = `Arquivo selecionado: ${file.name}`;
            fileName.classList.add('show');
        } else {
            fileName.textContent = '';
            fileName.classList.remove('show');
        }
    });

    // Salvar documento
    saveDocBtn.addEventListener('click', saveDocument);

    // Permitir arrastar e soltar arquivos
    fileUploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.style.borderColor = '#6D398E';
        this.style.backgroundColor = '#76378f11';
    });

    fileUploadArea.addEventListener('dragleave', function () {
        this.style.borderColor = '#ddd';
        this.style.backgroundColor = '';
    });

    fileUploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        this.style.borderColor = '#ddd';
        this.style.backgroundColor = '';

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            const file = fileInput.files[0];
            fileName.textContent = `Arquivo selecionado: ${file.name}`;
            fileName.classList.add('show');
        }
    });
}

// Funções
function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    docForm.reset();
    fileName.textContent = '';
    fileName.classList.remove('show');
}
function getCSRFToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function apiRequest(url, data, method = 'POST') {
    try {
        const headers = {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        };

        const options = {
            method,
            credentials: 'same-origin',
            headers
        };

        // ✅ Se for FormData, NÃO seta Content-Type e NÃO faz JSON.stringify
        if (data instanceof FormData) {
            options.body = data;
        } else {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        return await response.json();

    } catch (error) {
        console.error('Erro na requisição:', error);
        return { success: false, error: 'Erro de conexão' };
    }
}




const docTypeSelect = document.getElementById('docType');
const docExpiryInput = document.getElementById('docExpiry');

docTypeSelect.addEventListener('change', () => {
    const opt = docTypeSelect.options[docTypeSelect.selectedIndex];
    const exigeValidade = opt.dataset.exigeValidade === '1';

    docExpiryInput.required = exigeValidade;

    if (!exigeValidade) {
        docExpiryInput.value = '';
    }
});



async function saveDocument() {
    const formData = new FormData();
    formData.append('docType', document.getElementById('docType').value);
    formData.append('docExpiry', document.getElementById('docExpiry').value);
    formData.append('docNotes', document.getElementById('docNotes').value);
    formData.append('arquivo', fileInput.files[0]);

    const res = await apiRequest('/api/salvar-documento/', formData);

    if (res.success) {
        mostrarMensagem('Documento salvo com sucesso', 'success');
        closeModal();

    } else {
        mostrarMensagem('Erro ao salvar: ' + res.error, 'error');
    }
}


