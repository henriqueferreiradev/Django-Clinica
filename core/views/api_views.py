from django.http import JsonResponse
from core.models import Paciente


def verificar_cpf(request):
    cpf = request.GET.get('cpf', None)
    existe = False
    
    if cpf:
        existe = Paciente.objects.filter(cpf=cpf).exists()
    
        return JsonResponse({'existe':existe})