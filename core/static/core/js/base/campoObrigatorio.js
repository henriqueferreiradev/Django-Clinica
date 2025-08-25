document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("form").forEach(form => {
      // Evita conflito com validação nativa
      form.setAttribute("novalidate", "");
  
      form.addEventListener("submit", e => {
        let valido = true;
  
        form.querySelectorAll("[required]").forEach(input => {
          // acha/cria o small de erro no mesmo .formField (ou parent imediato)
          let container = input.closest(".formField") || input.parentElement;
          let msg = container.querySelector(".erro-msg");
          if (!msg) {
            msg = document.createElement("small");
            msg.className = "erro-msg";
            container.appendChild(msg);
          }
  
          const vazio = (input.type === "checkbox" || input.type === "radio")
            ? !input.checked
            : !String(input.value || "").trim();
  
          if (vazio) {
            valido = false;
            input.classList.add("error");
            msg.textContent = "Campo obrigatório";
            msg.classList.add("ativo");
          } else {
            input.classList.remove("error");
            msg.textContent = "";
            msg.classList.remove("ativo");
          }
        });
  
        if (!valido) e.preventDefault();
      });
  
      // feedback em tempo real (opcional, mas recomendo)
      form.addEventListener("input", e => {
        const input = e.target.closest("[required]");
        if (!input) return;
  
        let container = input.closest(".formField") || input.parentElement;
        let msg = container.querySelector(".erro-msg");
        if (!msg) return;
  
        const vazio = (input.type === "checkbox" || input.type === "radio")
          ? !input.checked
          : !String(input.value || "").trim();
  
        if (!vazio) {
          input.classList.remove("error");
          msg.textContent = "";
          msg.classList.remove("ativo");
        }
      });
    });
  });
  