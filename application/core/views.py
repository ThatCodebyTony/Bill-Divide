from django.shortcuts import render

def create_bill(request):
    return render(request, "core/create_bill.html")
