from django.urls import path
from . import views

urlpatterns = [
    path("", views.create_bill, name="create_bill"),  # root of the site
]
