from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from .models import Bill, Participant, Payment


class BillModelTest(TestCase):
    """Test cases for the Bill model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_bill(self):
        """Test creating a bill."""
        bill = Bill.objects.create(
            title='Dinner at Restaurant',
            description='Team dinner',
            total_amount=Decimal('100.00'),
            created_by=self.user
        )
        self.assertEqual(bill.title, 'Dinner at Restaurant')
        self.assertEqual(bill.total_amount, Decimal('100.00'))
        self.assertFalse(bill.is_settled)
        self.assertEqual(str(bill), 'Dinner at Restaurant - $100.00')
    
    def test_bill_ordering(self):
        """Test that bills are ordered by creation date (newest first)."""
        bill1 = Bill.objects.create(
            title='Bill 1',
            total_amount=Decimal('50.00'),
            created_by=self.user
        )
        bill2 = Bill.objects.create(
            title='Bill 2',
            total_amount=Decimal('75.00'),
            created_by=self.user
        )
        bills = Bill.objects.all()
        self.assertEqual(bills[0], bill2)  # Newest first
        self.assertEqual(bills[1], bill1)


class ParticipantModelTest(TestCase):
    """Test cases for the Participant model."""
    
    def setUp(self):
        """Set up test data."""
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
        self.bill = Bill.objects.create(
            title='Test Bill',
            total_amount=Decimal('100.00'),
            created_by=self.user1
        )
    
    def test_create_participant(self):
        """Test creating a participant."""
        participant = Participant.objects.create(
            bill=self.bill,
            user=self.user1,
            share_amount=Decimal('50.00')
        )
        self.assertEqual(participant.share_amount, Decimal('50.00'))
        self.assertFalse(participant.has_paid)
        self.assertEqual(str(participant), 'user1 - $50.00')
    
    def test_unique_participant_per_bill(self):
        """Test that a user can only be added once per bill."""
        Participant.objects.create(
            bill=self.bill,
            user=self.user1,
            share_amount=Decimal('50.00')
        )
        # Attempting to create a duplicate should raise an error
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Participant.objects.create(
                bill=self.bill,
                user=self.user1,
                share_amount=Decimal('25.00')
            )


class PaymentModelTest(TestCase):
    """Test cases for the Payment model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(username='payer', password='pass')
        self.bill = Bill.objects.create(
            title='Test Bill',
            total_amount=Decimal('100.00'),
            created_by=self.user
        )
    
    def test_create_payment(self):
        """Test creating a payment."""
        payment = Payment.objects.create(
            bill=self.bill,
            payer=self.user,
            amount=Decimal('50.00'),
            notes='First payment'
        )
        self.assertEqual(payment.amount, Decimal('50.00'))
        self.assertEqual(payment.notes, 'First payment')
        self.assertTrue('payer paid $50.00' in str(payment))
    
    def test_payment_ordering(self):
        """Test that payments are ordered by date (newest first)."""
        payment1 = Payment.objects.create(
            bill=self.bill,
            payer=self.user,
            amount=Decimal('30.00')
        )
        payment2 = Payment.objects.create(
            bill=self.bill,
            payer=self.user,
            amount=Decimal('20.00')
        )
        payments = Payment.objects.all()
        self.assertEqual(payments[0], payment2)  # Newest first
        self.assertEqual(payments[1], payment1)
