from django.shortcuts import render


def lembrete_views(request):
    return render(request, 'core/lembrete/lembrete.html')