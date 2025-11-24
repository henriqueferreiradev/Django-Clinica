const htmlEl = document.documentElement;
const sliderIcon = document.getElementById('sliderIcon');
const themeToggle = document.getElementById('themeToggle');

// Aplica tema salvo
export function applySavedTheme() {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark';
    htmlEl.classList.toggle('dark', isDark);
    htmlEl.classList.toggle('light', !isDark);
    themeToggle.checked = isDark;
    sliderIcon.innerHTML = isDark
        ? "<i class='bx bx-sun'></i>"
        : "<i class='bx bx-moon'></i>";
}

export function toggleDarkMode() {
    const isDark = htmlEl.classList.contains('dark');
    htmlEl.classList.toggle('dark');
    htmlEl.classList.toggle('light');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    sliderIcon.innerHTML = isDark
        ? "<i class='bx bx-moon'></i>"
        : "<i class='bx bx-sun'></i>";
}