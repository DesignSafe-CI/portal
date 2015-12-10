from django.shortcuts import render

# Create your views here.
def index(request):
    return render(request, 'designsafe/apps/accounts/index.html')

def register(request):
    return render(request, 'designsafe/apps/accounts/register.html')