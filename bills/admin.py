from django.contrib import admin
from .models import Bill, Participant, Payment


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ['title', 'total_amount', 'created_by', 'created_at', 'is_settled']
    list_filter = ['is_settled', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ['bill', 'user', 'share_amount', 'has_paid', 'paid_at']
    list_filter = ['has_paid', 'bill']
    search_fields = ['bill__title', 'user__username']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['bill', 'payer', 'amount', 'payment_date']
    list_filter = ['payment_date']
    search_fields = ['bill__title', 'payer__username']
    readonly_fields = ['payment_date']
