from django.contrib import admin
from .models import User, Paciente, Funcionario, Pagamento, Especialidade
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informações adicionais', {'fields':("tipo",'telefone','ativo')}),
    )
    list_display = ('username','email','tipo','ativo')
    list_filter = ('tipo','ativo')
    
admin.site.register(User, UserAdmin)
admin.site.register(Paciente)
admin.site.register(Funcionario)
admin.site.register(Pagamento)
admin.site.register(Especialidade)