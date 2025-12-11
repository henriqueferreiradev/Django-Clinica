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

