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

// Sistema de Notificações - Apenas Abertura/Fechamento
class NotificationModal {
  constructor() {
      this.initializeElements();
      this.setupEventListeners();
  }
  
  initializeElements() {
      // Elementos DOM
      this.bellIcon = document.getElementById('bellIcon');
      this.notificationModal = document.getElementById('notificationModal');
      this.closeModal = document.getElementById('closeModal');
  }
  
  setupEventListeners() {
      // Abrir modal ao clicar no sininho
      this.bellIcon.addEventListener('click', () => this.openModal());
      
      // Fechar modal
      this.closeModal.addEventListener('click', () => this.closeModalFn());
      
      // Fechar modal ao clicar fora
      this.notificationModal.addEventListener('click', (e) => {
          if (e.target === this.notificationModal) {
              this.closeModalFn();
          }
      });
      
      // Fechar modal com a tecla ESC
      document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.notificationModal.style.display === 'flex') {
              this.closeModalFn();
          }
      });
  }
  
  openModal() {
      this.notificationModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Adicionar classe para animação
      this.notificationModal.classList.add('active');
      
      // Disparar evento customizado (opcional)
      const event = new CustomEvent('notificationModalOpen');
      document.dispatchEvent(event);
  }
  
  closeModalFn() {
      this.notificationModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      
      // Remover classe ativa
      this.notificationModal.classList.remove('active');
      
      // Disparar evento customizado (opcional)
      const event = new CustomEvent('notificationModalClose');
      document.dispatchEvent(event);
  }
  
  // Método para verificar se o modal está aberto
  isOpen() {
      return this.notificationModal.style.display === 'flex';
  }
  
  // Método para alternar entre abrir/fechar
  toggleModal() {
      if (this.isOpen()) {
          this.closeModalFn();
      } else {
          this.openModal();
      }
  }
}

// Versão ainda mais simplificada (funções separadas)
const ModalManager = {
  init: function() {
      this.bellIcon = document.getElementById('bellIcon');
      this.modal = document.getElementById('notificationModal');
      this.closeBtn = document.getElementById('closeModal');
      
      if (this.bellIcon && this.modal) {
          this.setupEvents();
          console.log('Modal de notificações inicializado');
      } else {
          console.error('Elementos do modal não encontrados');
      }
  },
  
  setupEvents: function() {
      // Clique no sininho
      this.bellIcon.addEventListener('click', () => this.open());
      
      // Clique no botão de fechar
      this.closeBtn.addEventListener('click', () => this.close());
      
      // Clique fora do modal
      this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) this.close();
      });
      
      // Tecla ESC
      document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.modal.style.display === 'flex') {
              this.close();
          }
      });
  },
  
  open: function() {
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Adicionar animação de entrada
      setTimeout(() => {
          this.modal.classList.add('active');
      }, 10);
  },
  
  close: function() {
      this.modal.classList.remove('active');
      
      // Esperar animação de saída antes de esconder
      setTimeout(() => {
          this.modal.style.display = 'none';
          document.body.style.overflow = 'auto';
      }, 300); // Tempo deve corresponder à duração da animação CSS
  },
  
  isOpen: function() {
      return this.modal.style.display === 'flex';
  }
};

// Versão mais simples ainda (apenas funções)
function initNotificationModal() {
  const bellIcon = document.getElementById('bellIcon');
  const modal = document.getElementById('notificationModal');
  const closeBtn = document.getElementById('closeModal');
  
  if (!bellIcon || !modal || !closeBtn) {
      console.warn('Elementos do modal não encontrados');
      return;
  }
  
  // Abrir modal
  bellIcon.addEventListener('click', () => {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
  });
  
  // Fechar modal
  closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
  });
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
      if (e.target === modal) {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
      }
  });
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
      }
  });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  // Escolha uma das opções acima:
  
  // Opção 1: Classe completa
  // window.notificationModal = new NotificationModal();
  
  // Opção 2: Objeto simples
  // ModalManager.init();
  
  // Opção 3: Função simples
  initNotificationModal();
});