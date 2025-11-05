from django.shortcuts import render

def create_bill(request):
    return render(request, "core/create_bill.html")

def past_bills(request):
    return render(request, "core/past_bills.html")

def bills_home(request):
    return render(request, "core/bills_home.html")
