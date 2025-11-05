from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("", views.create_bill, name="create_bill"),      # /
    path("bills/", views.bills_home, name="bills_home"),  # /bills/
    path("bills/past/", views.past_bills, name="past_bills"),  # /bills/past/
]
