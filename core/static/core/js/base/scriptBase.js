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
function toggleDropdown(button) {
  const dropdown = button.nextElementSibling;

  // Fecha todos os outros dropdowns
  document.querySelectorAll(".dropdown").forEach(drop => {
      if (drop !== dropdown) {
          drop.style.display = "none";
      }
  });

  // Alterna o dropdown atual
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";

  // Adiciona o listener global só uma vez
  document.addEventListener("click", function handleClickOutside(event) {
      if (!button.contains(event.target) && !dropdown.contains(event.target)) {
          dropdown.style.display = "none";
          document.removeEventListener("click", handleClickOutside); // Remove após esconder
      }
  });
}

temporizadorAlerta()