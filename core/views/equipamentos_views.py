from django.shortcuts import render
 


def gestao_equipamentos(request):
    return render(request, 'core/equipamentos/gestao_equipamentos.html')
 