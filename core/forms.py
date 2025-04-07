from django import forms
from django.contrib.auth.forms import AuthenticationForm

class LoginForm(AuthenticationForm):
    username = forms.CharField(label="Usuário", widget=forms.TextInput(attrs={"class":"form-control"}))
    password = forms.CharField(label="Senha", widget=forms.PasswordInput(attrs={"class":"form-control"}))

class RegisterForm(AuthenticationForm):
    username = forms.CharField(label="Usuário", widget=forms.TextInput(attrs={"class":"form-control"}))
    password = forms.CharField(label="Senha", widget=forms.PasswordInput(attrs={"class":"form-control"}))