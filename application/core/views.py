from django.shortcuts import render

def index(request):
    # Serve the SPA base template
    return render(request, "core/base.html")
