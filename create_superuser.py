# create_superuser.py
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinica_project.settings')
django.setup()

User = get_user_model()

username = 'admin'
email = 'admin@example.com'
password = 'admin123'

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print("✅ Superusuário criado com sucesso!")
else:
    print("ℹ️ Superusuário já existe.")
