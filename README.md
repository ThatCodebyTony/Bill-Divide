# Bill-Divide Frontend Files

```
application/core/static/core/css/
├── base.css        # Global styles for layout, typography, and colors
└── app.css         # Component-specific styles for the main app interface

application/core/static/core/js/
├── main.js         # Initializes the app and binds core functionality
├── router.js       # Handles navigation and view rendering (SPA-style routing)
├── state.js        # Centralized state management for shared data
├── storage.js      # Utilities for persisting data in local/session storage
├── utils.js        # Common helper functions used across views
└── views/          # JavaScript modules for individual frontend views
    ├── home.js     # Logic and rendering for the home dashboard
    ├── bills.js    # Displays and manages bills and payment splits
    ├── profile.js  # Handles user profile data and settings
    └── createForm.js # Controls the bill creation and submission form

application/core/templates/core/
└── base.html       # Root HTML template defining page structure and static asset inclusion


```
# Running the Project

Follow these steps to set up and run **Bill-Divide** locally (all commands are run inside the `application/` directory):

```bash
# 1. Navigate into the application directory
cd application

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Upgrade pip
pip install --upgrade pip

# 4. Install Django (project uses Django 5.2.x)
pip install "Django==5.2.7"

# 5. Apply migrations (sets up the local SQLite database)
python manage.py migrate

# 6. Run the development server
python manage.py runserver
```

Once the server starts, open your browser and go to:

**http://127.0.0.1:8000/**
