from django.db import models
from django.contrib.auth.models import User


class Bill(models.Model):
    """Model representing a bill to be divided among multiple people."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_bills')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_settled = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - ${self.total_amount}"


class Participant(models.Model):
    """Model representing a participant in a bill split."""
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='participated_bills')
    share_amount = models.DecimalField(max_digits=10, decimal_places=2)
    has_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['bill', 'user']

    def __str__(self):
        return f"{self.user.username} - ${self.share_amount}"


class Payment(models.Model):
    """Model representing a payment made towards a bill."""
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='payments')
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_made')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.payer.username} paid ${self.amount} for {self.bill.title}"
