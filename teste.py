mostrar_todos = request.GET.get('mostrar_todos') == 'on'
filtra_inativo = request.GET.get('filtra_inativo') == 'on'
situacao = request.GET.get('situacao') == True

if request.method == 'POST':
    if 'delete_id' in request.POST:
        delete_id = request.POST.get('delete_id')
        profissional = Profissional.objects.get(id=delete_id)
        profissional.ativo = False
        profissional.save()
        return redirect('profissionals')

    # Edição ou criação
    profissional_id = request.POST.get('profissional_id')
    nome = request.POST.get('nome')
    sobrenome = request.POST.get('sobrenome')
    nomeSocial = request.POST.get('nomeSocial')
    rg = request.POST.get('rg')
    cpf = request.POST.get('cpf')
    nascimento = request.POST.get('nascimento')
    try:
        nascimento_formatada = datetime.strptime(nascimento, "%d/%m/%Y").date()
    except ValueError:
        ...
    cor_raca = request.POST.get('cor')
    sexo = request.POST.get('sexo')
    estado_civil = request.POST.get('estado_civil')
    naturalidade = request.POST.get('naturalidade')
    uf = request.POST.get('uf')
    midia = request.POST.get('midia')
    foto = request.FILES.get('foto')
    observacao = request.POST.get('observacao')

    cep = request.POST.get('cep')
    rua = request.POST.get('rua')
    numero = request.POST.get('numero')
    complemento = request.POST.get('complemento')
    bairro = request.POST.get('bairro')
    cidade = request.POST.get('cidade')
    estado = request.POST.get('estado')

    telefone = request.POST.get('telefone')
    celular = request.POST.get('celular')
    email = request.POST.get('email')
    nomeEmergencia = request.POST.get('nomeEmergencia')
    vinculo = request.POST.get('vinculo')
    telEmergencia = request.POST.get('telEmergencia')
    
    
    
    if profissional_id:
        profissional = Profissional.objects.get(id=profissional_id)
        profissional.nome = nome
        profissional.sobrenome = sobrenome
        profissional.nomeSocial = nomeSocial
        profissional.rg = rg
        profissional.cpf = cpf
        profissional.nascimento = nascimento
        profissional.cor_raca = cor_raca
        profissional.sexo = sexo
        profissional.estado_civil = estado_civil
        profissional.naturalidade = naturalidade
        profissional.uf = uf
        profissional.midia = midia
        profissional.foto = foto
        profissional.observacao = observacao

        profissional.cep = cep
        profissional.rua = rua
        profissional.numero = numero
        profissional.complemento = complemento
        profissional.bairro = bairro
        profissional.cidade = cidade
        profissional.estado = estado

        profissional.telefone = telefone
        profissional.celular = celular
        profissional.email = email
        profissional.nomeEmergencia = nomeEmergencia
        profissional.vinculo = vinculo
        profissional.telEmergencia = telEmergencia
         
        profissional.ativo = True
        profissional.save()
    else:
        # Garante que nome foi enviado
        if nome:
            profissional = Profissional.objects.create(nome=nome, sobrenome=sobrenome, nomeSocial=nomeSocial, cpf=cpf,
                                    vinculo=vinculo,
                                    rg=rg,data_nascimento=nascimento_formatada,
                                    cor_raca=cor_raca, sexo=sexo, naturalidade=naturalidade,
                                    uf=uf,estado_civil=estado_civil, complemento=complemento,
                                    midia=midia, cep=cep, rua=rua, numero=numero,bairro=bairro,
                                    cidade=cidade,estado=estado,telefone=telefone, celular=celular, 
                                    nomeEmergencia=nomeEmergencia, telEmergencia=telEmergencia,
                                    email=email, observacao=observacao ,ativo=True)
        if foto:
            profissional.foto = foto
            profissional.save()
    
    messages.success(request, f'Profissional { profissional.nome } cadastrado com sucesso!!')
    return redirect('cadastrar_profissional')

query = request.GET.get('q', '').strip()

if mostrar_todos:
    profissionals = Profissional.objects.all().order_by('-id')
elif filtra_inativo:
    profissionals = Profissional.objects.filter(ativo=False)
else:
    profissionals = Profissional.objects.filter(ativo=True).order_by('-id')

total_ativos = Profissional.objects.filter(ativo=True).count()


if query:
    profissionals = profissionals.filter(Q(nome__icontains=query) | Q(cpf__icontains=query))

paginator = Paginator(profissionals, 12)
page_number = request.GET.get("page")
try:
    page_obj = paginator.get_page(page_number)
except PageNotAnInteger:
    page_obj = paginator.page(1)
except EmptyPage:
    page_obj = paginator.page(paginator.num_pages)

return render(request, 'core/profissionais/cadastrar_profissional.html', {
    'page_obj': page_obj,
    'query': query,
    'total_ativos': total_ativos,
    'mostrar_todos': mostrar_todos,
    'filtra_inativo': filtra_inativo,
    'estado_civil_choices': ESTADO_CIVIL,
    'midia_choices': MIDIA_ESCOLHA,
    'sexo_choices': SEXO_ESCOLHA,
    'uf_choices': UF_ESCOLHA,
    'cor_choices': COR_RACA,
    'vinculo_choices': VINCULO,
    'conselho_choices': CONSELHO_ESCOLHA,
})