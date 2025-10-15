from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login, logout
from django.contrib import messages
from django.shortcuts import render, redirect

def login_view(request):
    form = AuthenticationForm(request, data=request.POST or None)

    if request.method == 'POST':
        if form.is_valid():
            user = form.get_user()
            login(request, user)

            # Se existir parâmetro next (quando login_required redireciona)
            next_url = request.GET.get('next') or request.POST.get('next')

            # Verifica o tipo de usuário
            if user.tipo == 'profissional':
                return redirect('agenda_profissional')  # troque pelo nome real da sua rota

            # Redirecionamento padrão
            return redirect(next_url or 'dashboard')

        else:
            messages.error(request, "Usuário ou senha inválidos.")

    return render(request, 'core/login.html', {'form': form})


def logout_view(request):
    logout(request)
    return redirect('login')
