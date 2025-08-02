import { initializeToasts, showSlideToast, showDarkToast } from './toast.js';
import { applySavedTheme, toggleDarkMode } from './darkMode.js';

// Inicializa os toasts quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    initializeToasts();
    
    // Aplica o tema salvo
    applySavedTheme();
    
    // Configura o evento do toggle
    document.getElementById('themeToggle').addEventListener('change', toggleDarkMode);
});

// Exporta funções para uso global (se necessário)
window.showSlideToast = showSlideToast;
window.showDarkToast = showDarkToast;
window.toggleDarkMode = toggleDarkMode;