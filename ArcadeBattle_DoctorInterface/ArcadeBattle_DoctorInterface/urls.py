"""ArcadeBattle_DoctorInterface URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from app import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", views.index, name="index"),
    path("login", views.login, name="login"),
    path("all_patients", views.all_patients, name="all_patients"),
    path("all_admins", views.all_admins, name="all_admins"),
    path("all_doctors", views.all_doctors, name="all_doctors"),
    path("patient_statistics", views.patient_statistics, name="patient_statistics"),
    path("admin_statistics", views.admin_statistics, name="admin_statistics"),
    path("doctor_statistics", views.doctor_statistics, name="doctor_statistics"),
    path("general_statistics", views.general_statistics, name="general_statistics"),
    path("games", views.games, name="games"),
    path("add_patient", views.add_patient, name="add_patient"),
    path("add_admin", views.add_admin, name="add_admin"),
    path("add_doctor", views.add_doctor, name="add_doctor"),
    path("send_email", views.send_email, name="send_mail")
]
