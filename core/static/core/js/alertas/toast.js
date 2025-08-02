// Toast functions
export function initializeToasts() {
    const toasts = document.querySelectorAll('.toast');
    
    toasts.forEach(toast => {
        // Configurar fechamento automático
        setTimeout(() => {
            toast.classList.remove('toast-slide-in');
            toast.classList.add('toast-slide-out');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
        
        // Configurar botão de fechar
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.classList.remove('toast-slide-in');
                toast.classList.add('toast-slide-out');
                setTimeout(() => toast.remove(), 500);
            });
        }
    });
}

export function showSlideToast(type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Set toast content
    toast.className = 'toast toast-success toast-slide-in';
    
    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const header = document.createElement('div');
    header.className = 'toast-header';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'toast-icon';
    iconDiv.innerHTML = '<i class="fas fa-check-circle"></i>';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'toast-title';
    titleDiv.textContent = 'Success';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => toast.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = 'Operation completed successfully!';
    
    header.appendChild(iconDiv);
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);
    
    content.appendChild(header);
    content.appendChild(messageDiv);
    toast.appendChild(content);
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('toast-slide-in');
        toast.classList.add('toast-slide-out');
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

export function showDarkToast() {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    toast.className = 'toast toast-dark toast-flip-in';
    
    const content = document.createElement('div');
    content.className = 'toast-content';
    
    const header = document.createElement('div');
    header.className = 'toast-header';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'toast-icon dark-icon';
    iconDiv.innerHTML = '<i class="fas fa-moon"></i>';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'toast-title';
    titleDiv.textContent = 'Dark Notification';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.onclick = () => {
        toast.classList.remove('toast-flip-in');
        toast.classList.add('toast-flip-out');
        setTimeout(() => toast.remove(), 750);
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = 'This is a dark mode notification';
    
    header.appendChild(iconDiv);
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);
    
    content.appendChild(header);
    content.appendChild(messageDiv);
    toast.appendChild(content);
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('toast-flip-in');
        toast.classList.add('toast-flip-out');
        setTimeout(() => toast.remove(), 750);
    }, 5000);
}