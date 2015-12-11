from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, 'designsafe/apps/accounts/index.html')


def login(request):
    return render(request, 'designsafe/apps/accounts/login.html')