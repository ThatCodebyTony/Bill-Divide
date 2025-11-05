# Bill-Divide

A Django-based web application for splitting bills among multiple people, built with Django and SQL database support.

## Tech Stack

- **Backend Framework**: Django 4.2+
- **Database**: 
  - SQLite (Development)
  - PostgreSQL (Production)
- **Python**: 3.12+

## Features

- User authentication and management
- Create and manage bills
- Split bills among multiple participants
- Track payments
- Mark bills as settled
- Admin interface for managing data

## Database Models

### Bill
- Title, description, and total amount
- Creator and timestamps
- Settlement status

### Participant
- Links users to bills
- Individual share amounts
- Payment status tracking

### Payment
- Payment records
- Amount and date tracking
- Notes for payment details

## Installation

### Prerequisites

- Python 3.12 or higher
- pip package manager
- PostgreSQL (for production)

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/ThatCodebyTony/Bill-Divide.git
cd Bill-Divide
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables (optional for PostgreSQL):
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run database migrations:
```bash
python manage.py migrate
```

5. Create a superuser (admin):
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

7. Access the application:
- Main site: http://localhost:8000
- Admin interface: http://localhost:8000/admin

## Database Configuration

### SQLite (Default - Development)
The application uses SQLite by default, which requires no additional configuration. The database file `db.sqlite3` will be created automatically.

### PostgreSQL (Production)
To use PostgreSQL, set the following environment variables in your `.env` file:

```
DATABASE_URL=postgresql://user:password@localhost:5432/billdivide
DB_NAME=billdivide
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

## Project Structure

```
Bill-Divide/
├── billdivide/          # Django project settings
│   ├── settings.py      # Main settings (with SQL database config)
│   ├── urls.py          # URL routing
│   └── wsgi.py          # WSGI configuration
├── bills/               # Bills app
│   ├── models.py        # Database models (Bill, Participant, Payment)
│   ├── admin.py         # Admin interface configuration
│   ├── views.py         # Views (to be implemented)
│   └── migrations/      # Database migrations
├── manage.py            # Django management script
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Management Commands

```bash
# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Access Django shell
python manage.py shell

# Run tests
python manage.py test
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.