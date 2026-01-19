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

let arrow = document.querySelectorAll(".arrow");
for (var i = 0; i < arrow.length; i++) {
  arrow[i].addEventListener("click", (e) => {
    let arrowParent = e.target.parentElement.parentElement;//selecting main parent of arrow
    arrowParent.classList.toggle("showMenu");
  });
}

let sidebar = document.querySelector(".sidebar");
let sidebarBtn = document.querySelector(".bx-menu");
console.log(sidebarBtn);
sidebarBtn.addEventListener("click", () => {
  sidebar.classList.toggle("close");
});



window.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("input").forEach(input => {
    input.setAttribute("autocomplete", "off");
  });
});

function temporizadorAlerta() {
  setTimeout(() => {
    const alert = document.getElementById("alert-container");
    if (alert) alert.style.display = "none";
  }, 4000);
}


temporizadorAlerta()

document.addEventListener('DOMContentLoaded', () => {
    // Elementos das Notificações
    const notificationIcon = document.getElementById('bellIcon');
    const notificationModal = document.getElementById('notificationModal');
    const notificationClose = document.getElementById('notificationCloseModal');
    
    // Elementos das Mensagens
    const messageIcon = document.getElementById('messageIcon');
    const messageModal = document.getElementById('messageModal');
    const messageClose = document.getElementById('messageCloseModal');
    
    // Variável para armazenar todas as mensagens
    let todasMensagens = [];

    // ===== NOTIFICAÇÕES =====
    if (notificationIcon && notificationModal && notificationClose) {
        // Abrir modal de notificações
        notificationIcon.addEventListener('click', () => {
            notificationModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
        
        // Fechar modal de notificações
        const closeNotificationModal = () => {
            notificationModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        
        notificationClose.addEventListener('click', closeNotificationModal);
        
        // Fechar ao clicar fora (notificações)
        notificationModal.addEventListener('click', (e) => {
            if (e.target === notificationModal) closeNotificationModal();
        });
    }
    
    // ===== MENSAGENS =====
    if (messageIcon && messageModal && messageClose) {
        // Abrir modal de mensagens
        messageIcon.addEventListener('click', carregarMensagens);
        
        // Fechar modal de mensagens
        const closeMessageModal = () => {
            messageModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
        
        messageClose.addEventListener('click', closeMessageModal);
        
        // Fechar ao clicar fora (mensagens)
        messageModal.addEventListener('click', (e) => {
            if (e.target === messageModal) closeMessageModal();
        });
    }
    
    // ===== FUNÇÃO PARA CARREGAR MENSAGENS =====
    function carregarMensagens() {
        const messagesList = document.getElementById('messagesList');
        
        messageModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    
        fetch(`/api/mensagens-padrao/`)
        .then(res => res.json())
        .then(response => {
            console.log('Dados recebidos da API:', response);
            
            // Armazenar todas as mensagens
            todasMensagens = response.mensagens || [];
            console.log('Total de mensagens:', todasMensagens.length);
            
            // Renderizar todas as mensagens inicialmente
            renderizarMensagens(todasMensagens);
            
            // Configurar a busca
            configurarBusca();
        })
        .catch((error) => {
            console.error('Erro ao carregar mensagens:', error);
            mostrarMensagem('Erro ao carregar mensagens', 'error');
        });
    }
    
    // ===== FUNÇÃO PARA RENDERIZAR MENSAGENS =====
    function renderizarMensagens(mensagens) {
        const messagesList = document.getElementById('messagesList');
        
        // Limpar lista atual
        messagesList.innerHTML = '';
        
        // Verificar se há mensagens
        if (!mensagens || mensagens.length === 0) {
            messagesList.innerHTML = '<p class="no-messages">Nenhuma mensagem encontrada</p>';
            return;
        }
        
        // Para cada mensagem, criar um item
        mensagens.forEach(mensagem => {
            // Encontrar o template
            const template = document.querySelector('.message-item.template');
            
            if (!template) {
                console.error('Template não encontrado!');
                return;
            }
            
            // Clonar o template
            const newMessage = template.cloneNode(true);
            newMessage.style.display = 'flex'; // Tornar visível
            
            // Remover a classe template
            newMessage.classList.remove('template');
            
            // Preencher os dados conforme a estrutura da API
            const messageTitle = newMessage.querySelector('h4');
            const messageDescription = newMessage.querySelector('p');
            const messageTime = newMessage.querySelector('.message-time');
            
            // Usando os nomes corretos das propriedades
            if (messageTitle) messageTitle.textContent = mensagem.titulo || 'Sem título';
            if (messageDescription) messageDescription.textContent = mensagem.mensagem || 'Sem conteúdo';
            
            // Formatando a data corretamente
            if (messageTime && mensagem.criado_em) {
                messageTime.textContent = `Atualizado em: ${formatarData(mensagem.criado_em)}`;
            } else {
                messageTime.textContent = 'Data não disponível';
            }
            
            // Adicionar à lista
            messagesList.appendChild(newMessage);
        });
        
        console.log(`${mensagens.length} mensagens renderizadas`);
    }
    
    // ===== FUNÇÃO PARA CONFIGURAR BUSCA =====
    function configurarBusca() {
        // Encontrar o input de busca (já existe no HTML)
        const searchInput = document.querySelector('#messageModal input[type="search"]');
        
        if (!searchInput) {
            console.error('Input de busca não encontrado!');
            return;
        }
        
        // Limpar valor anterior
        searchInput.value = '';
        
        // Configurar placeholder e estilo
        searchInput.placeholder = 'Buscar no título ou mensagem...';
        searchInput.style.padding = '10px 15px';
        searchInput.style.marginBottom = '15px';
        searchInput.style.border = '1px solid #ddd';
        searchInput.style.borderRadius = '6px';
        searchInput.style.fontSize = '14px';
        
        // Evento de busca em tempo real
        searchInput.addEventListener('input', function(e) {
            const termo = e.target.value.toLowerCase().trim();
            filtrarMensagens(termo);
        });
        
        // Foco no campo de busca ao abrir o modal
        setTimeout(() => {
            searchInput.focus();
        }, 300);
    }
    
    // ===== FUNÇÃO PARA FILTRAR MENSAGENS =====
    function filtrarMensagens(termoBusca) {
        if (!termoBusca || termoBusca === '') {
            // Mostrar todas as mensagens se não houver termo
            renderizarMensagens(todasMensagens);
            return;
        }
        
        // Filtrar mensagens pelo título ou conteúdo
        const mensagensFiltradas = todasMensagens.filter(mensagem => {
            const titulo = (mensagem.titulo || '').toLowerCase();
            const conteudo = (mensagem.mensagem || '').toLowerCase();
            
            return titulo.includes(termoBusca) || conteudo.includes(termoBusca);
        });
        
        // Renderizar as mensagens filtradas
        renderizarMensagens(mensagensFiltradas);
        
        // Mostrar contador de resultados
        mostrarContadorResultados(mensagensFiltradas.length, termoBusca);
    }
    
    // ===== FUNÇÃO PARA MOSTRAR CONTADOR DE RESULTADOS =====
    function mostrarContadorResultados(quantidade, termoBusca) {
        // Remover contador anterior se existir
        let contadorAnterior = document.querySelector('#messageModal .contador-busca');
        if (contadorAnterior) {
            contadorAnterior.remove();
        }
        
        if (termoBusca) {
            const searchInput = document.querySelector('#messageModal input[type="search"]');
            const modalBody = document.querySelector('#messageModal .modal-body');
            
            if (searchInput && modalBody) {
                const contador = document.createElement('div');
                contador.className = 'contador-busca';
                contador.textContent = `${quantidade} resultado(s) encontrado(s)`;
                contador.style.cssText = `
                    margin: -10px 0 15px 0;
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                    padding: 0 5px;
                `;
                
                // Inserir após o campo de busca
                searchInput.parentNode.insertBefore(contador, searchInput.nextSibling);
            }
        }
    }
    
    // ===== FUNÇÃO PARA FORMATAR DATA =====
    function formatarData(dataString) {
        try {
            // A data vem como '2026-01-19'
            const partes = dataString.split('-');
            if (partes.length === 3) {
                const [ano, mes, dia] = partes;
                return `${dia}/${mes}/${ano}`;
            }
            
            // Tenta converter se for outro formato
            const data = new Date(dataString);
            if (!isNaN(data.getTime())) {
                const dia = data.getDate().toString().padStart(2, '0');
                const mes = (data.getMonth() + 1).toString().padStart(2, '0');
                const ano = data.getFullYear();
                return `${dia}/${mes}/${ano}`;
            }
            
            return dataString; // Retorna a string original se não conseguir formatar
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return dataString;
        }
    }
    
    // ===== FECHAR COM ESC (PARA AMBOS) =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Fechar modal de notificações se estiver aberto
            if (notificationModal && notificationModal.style.display === 'flex') {
                notificationModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
            
            // Fechar modal de mensagens se estiver aberto
            if (messageModal && messageModal.style.display === 'flex') {
                messageModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    });
});

// Função para copiar mensagem ao clicar no item
function configurarCliqueParaCopiarMensagem() {
    // Usar delegação de eventos para funcionar com elementos dinâmicos
    document.addEventListener('click', function(e) {
        // Verificar se o clique foi em um item de mensagem (não no template original)
        const messageItem = e.target.closest('.message-item:not(.template)');
        
        if (messageItem) {
            copiarTextoMensagem(messageItem);
        }
    });
}

// Função principal para copiar o texto da mensagem
function copiarTextoMensagem(messageItem) {
    // Encontrar o elemento que contém o texto da mensagem
    const messageTextElement = messageItem.querySelector('p');
    
    if (!messageTextElement) {
        mostrarMensagem('Elemento da mensagem não encontrado', 'error');
        return;
    }
    
    // Pegar o texto da mensagem
    const textoMensagem = messageTextElement.textContent.trim();
    
    if (!textoMensagem) {
        mostrarMensagem('Mensagem vazia', 'warning');
        return;
    }
    
    // Usar a Clipboard API para copiar
    navigator.clipboard.writeText(textoMensagem)
        .then(() => {
            // Feedback de sucesso usando a função existente
            mostrarMensagem('Mensagem copiada para a área de transferência!', 'success');
            
            // Adicionar feedback visual temporário no item
            adicionarFeedbackVisual(messageItem);
        })
        .catch(err => {
            console.error('Erro ao copiar:', err);
            
            // Fallback para navegadores mais antigos
            copiarComFallback(textoMensagem, messageItem);
        });
}

// Fallback para navegadores sem Clipboard API
function copiarComFallback(texto, messageItem) {
    try {
        // Criar um textarea temporário
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        
        // Selecionar e copiar
        textarea.select();
        textarea.setSelectionRange(0, 99999); // Para mobile
        
        const sucesso = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (sucesso) {
            mostrarMensagem('Mensagem copiada para a área de transferência!', 'success');
            adicionarFeedbackVisual(messageItem);
        } else {
            mostrarMensagem('Erro ao copiar a mensagem', 'error');
        }
    } catch (err) {
        console.error('Erro no fallback:', err);
        mostrarMensagem('Erro ao copiar a mensagem', 'error');
    }
}

// Adicionar feedback visual temporário no item
function adicionarFeedbackVisual(messageItem) {
    // Adicionar classe de destaque
    messageItem.classList.add('copied');
    
    // Remover destaque após 1.5 segundos
    setTimeout(() => {
        messageItem.classList.remove('copied');
    }, 1500);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', configurarCliqueParaCopiarMensagem);