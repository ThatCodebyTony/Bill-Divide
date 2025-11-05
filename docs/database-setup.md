# Database Setup Guide

This guide explains how to set up and configure the database for the Bill-Divide application.

## SQLite (Development - Default)

SQLite is configured by default and requires no additional setup. The database file `db.sqlite3` will be created automatically when you run migrations.

### Steps:
1. Run migrations:
   ```bash
   python manage.py migrate
   ```

2. The database is ready to use!

## PostgreSQL (Production)

PostgreSQL is recommended for production environments.

### Prerequisites:
- PostgreSQL 12 or higher installed
- psycopg2-binary (already included in requirements.txt)

### Setup Steps:

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   ```

2. **Create a PostgreSQL database**:
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Create database
   CREATE DATABASE billdivide;
   
   # Create user (optional)
   CREATE USER billdivide_user WITH PASSWORD 'your_password';
   
   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE billdivide TO billdivide_user;
   
   # Exit
   \q
   ```

3. **Configure environment variables**:
   
   Create a `.env` file in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your PostgreSQL credentials:
   ```
   DATABASE_URL=postgresql://billdivide_user:your_password@localhost:5432/billdivide
   DB_NAME=billdivide
   DB_USER=billdivide_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

4. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Verify connection**:
   ```bash
   python manage.py dbshell
   ```

## Switching Between Databases

The application automatically detects which database to use based on the `DATABASE_URL` environment variable:

- **No `DATABASE_URL` set**: Uses SQLite (default)
- **`DATABASE_URL` set**: Uses PostgreSQL

To switch databases, simply set or unset the `DATABASE_URL` environment variable.

## Database Schema

The application includes three main models:

### Bill
- **Fields**: title, description, total_amount, created_by, created_at, updated_at, is_settled
- **Purpose**: Store information about bills to be divided

### Participant
- **Fields**: bill, user, share_amount, has_paid, paid_at
- **Purpose**: Link users to bills and track their share amounts

### Payment
- **Fields**: bill, payer, amount, payment_date, notes
- **Purpose**: Record payments made towards bills

## Common Database Commands

```bash
# Create new migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# View migration status
python manage.py showmigrations

# Rollback migrations
python manage.py migrate bills 0001

# Access database shell
python manage.py dbshell

# Access Django shell with database access
python manage.py shell

# Create database backup (PostgreSQL)
pg_dump billdivide > backup.sql

# Restore database backup (PostgreSQL)
psql billdivide < backup.sql
```

## Troubleshooting

### PostgreSQL Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   sudo systemctl status postgresql
   ```

2. **Verify credentials**:
   - Double-check username, password, and database name in `.env`
   - Ensure the PostgreSQL user has proper permissions

3. **Check firewall settings**:
   - Ensure PostgreSQL port (5432) is accessible
   - Check `pg_hba.conf` for authentication settings

### Migration Issues

1. **Reset migrations** (development only):
   ```bash
   # Delete database
   rm db.sqlite3
   
   # Delete migration files (except __init__.py)
   find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
   find . -path "*/migrations/*.pyc" -delete
   
   # Recreate migrations
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Check migration status**:
   ```bash
   python manage.py showmigrations
   ```

## Security Notes

- Never commit `.env` file to version control
- Use strong passwords for database users
- Restrict database access to necessary IP addresses only
- Regularly backup your database
- Use SSL connections for remote PostgreSQL connections
