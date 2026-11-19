# OXIS Ticketing System

A full-stack event management and ticketing application developed for **Oxbridge International School (OXIS)**.

The application provides a central platform for managing school events, ticket sales, customer orders, payments, and event check-in. It includes a staff-facing dashboard, ticket generation, QR code scanning, and event-specific ticket designs.

Built with **React, Django REST Framework, and PostgreSQL**, the application uses Docker Compose for local development and service orchestration.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Docker Development](#docker-development)
- [Running Without Docker](#running-without-docker)
- [Useful Commands](#useful-commands)
- [Ticket Generation](#ticket-generation)
- [Development Guidelines](#development-guidelines)
- [Production Considerations](#production-considerations)

## Features

### Dashboard

- Overview of ticket sales and event activity.
- Sales charts and statistics.
- Recent orders.
- Check-in progress.

### Event Management

- Create, edit, and manage school events.
- Configure event names, descriptions, venues, and dates.
- Configure ticket sales periods.
- Set optional payment deadlines.
- Upload event banner images.
- Upload independent ticket backdrop images.
- Manage event-specific ticket types.

### Ticket Management

- Generate digital tickets for orders.
- Generate downloadable PDF tickets.
- Include QR codes for ticket identification and validation.
- Support custom ticket backgrounds for individual events.
- Use a default ticket backdrop when no custom image is provided.
- View and manage issued tickets.

### Order Management

- Create ticket orders.
- Associate orders with events and ticket types.
- Store customer contact information.
- Track order details and payment status.
- View tickets associated with orders.

### Payment Management

- Record customer payments.
- Review and manage payment records.
- Track payment status.
- Support payment deadlines for orders.

### Ticket Check-in

- Scan ticket QR codes.
- Validate tickets.
- Display scan results.
- Maintain a scan log.
- Monitor event check-in progress.

### User Management and Permissions

- User authentication.
- Role-based access control.
- Capability-based frontend permissions.
- Protected application routes.

### Additional Features

- Delivery management.
- Email history.
- Event filtering.
- Dashboard and reporting views.
- Demo mode with mock data support.

---

## Technology Stack

| Component           | Technology                |
| ------------------- | ------------------------- |
| Frontend framework  | React 19                  |
| Frontend build tool | Vite 8                    |
| Styling             | Tailwind CSS 4            |
| UI components       | Radix UI                  |
| Routing             | React Router              |
| Server state        | TanStack Query            |
| HTTP client         | Axios                     |
| Forms               | React Hook Form           |
| Validation          | Zod                       |
| Backend framework   | Django 5.2                |
| API framework       | Django REST Framework     |
| Authentication      | Simple JWT                |
| Database            | PostgreSQL 17             |
| Image processing    | Pillow                    |
| QR code generation  | Python QRCode             |
| PDF generation      | ReportLab                 |
| Containerisation    | Docker and Docker Compose |

---

## Architecture

The application follows a frontend/backend architecture.

```text
                 ┌──────────────────────────┐
                 │      React Frontend      │
                 │                          │
                 │  Dashboard               │
                 │  Events                  │
                 │  Orders                  │
                 │  Payments                │
                 │  Tickets                 │
                 │  QR Scanner              │
                 └────────────┬─────────────┘
                              │
                         REST API
                              │
                 ┌────────────▼─────────────┐
                 │   Django REST Framework  │
                 │                          │
                 │  Accounts                │
                 │  Events                  │
                 │  Orders                  │
                 │  Payments                │
                 │  Tickets                 │
                 │                          │
                 │  PDF Generation          │
                 │  QR Code Generation      │
                 └────────────┬─────────────┘
                              │
                 ┌────────────▼─────────────┐
                 │       PostgreSQL         │
                 │                          │
                 │  Application Data        │
                 └──────────────────────────┘
```

The frontend communicates with the backend through REST API endpoints. Django handles authentication, permissions, application logic, database operations, and ticket generation.

Uploaded images and other media files are stored separately from the database.

---

## Project Structure

```text
oxis-tickets/
│
├── backend/
│   ├── accounts/          # Authentication and user permissions
│   ├── config/            # Django project configuration
│   ├── events/            # Event management
│   ├── orders/            # Order management
│   ├── payments/          # Payment management
│   ├── tickets/           # Ticket management and PDF generation
│   ├── static/
│   │   └── tickets/       # Default ticket assets
│   ├── media/             # Uploaded media
│   ├── requirements/      # Python dependency files
│   ├── manage.py
│   └── Dockerfile
│
├── frontend/
│   ├── public/            # Public assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # Application layouts
│   │   ├── lib/           # Utilities and API configuration
│   │   ├── pages/         # Application pages
│   │   └── services/      # API service functions
│   ├── package.json
│   └── Dockerfile
│
├── media/                 # Persistent uploaded media
├── compose.yaml           # Docker Compose configuration
├── .env                   # Environment configuration
└── README.md
```

---

## Getting Started

### Prerequisites

For Docker-based development:

- Git
- Docker
- Docker Compose

For development without Docker:

- Python 3.11 or later
- Node.js and npm
- PostgreSQL 17 or compatible version

### 1. Clone the Repository

```bash
git clone <repository-url>
cd oxis-tickets
```

### 2. Configure Environment Variables

Create a `.env` file in the project root.

At minimum, the Docker Compose configuration requires:

```env
POSTGRES_DB=oxis_tickets
POSTGRES_USER=oxis_user
POSTGRES_PASSWORD=change_this_password
```

The backend also requires its Django and database configuration. For example:

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=oxis_tickets
DB_USER=oxis_user
DB_PASSWORD=change_this_password
DB_HOST=db
DB_PORT=5432
```

These are example values. Check `backend/config/settings.py` to ensure the variable names match the application's actual settings.

**Important:** Never commit `.env` or production credentials to Git.

### 3. Start the Application

The repository includes a `compose.yaml` file for starting the frontend, backend, and database together.

On Linux or WSL, export your user and group IDs before starting:

```bash
export UID=$(id -u)
export GID=$(id -g)
```

Build and start the application:

```bash
docker compose up --build
```

To run it in the background:

```bash
docker compose up -d --build
```

The services will be available at:

| Service        | Address                            |
| -------------- | ---------------------------------- |
| React frontend | http://localhost:5173              |
| Django backend | http://localhost:8000              |
| PostgreSQL     | Internal Docker network, port 5432 |

The PostgreSQL database is not published to the host in the current Compose configuration.

### 4. Run Database Migrations

Once the backend container is running:

```bash
docker compose exec backend python manage.py migrate
```

### 5. Create an Administrative User

```bash
docker compose exec backend python manage.py createsuperuser
```

You can now access the application through the frontend.

---

## Environment Configuration

The application uses environment variables to configure Django and PostgreSQL.

| Variable               | Purpose                          |
| ---------------------- | -------------------------------- |
| `POSTGRES_DB`          | PostgreSQL database name         |
| `POSTGRES_USER`        | PostgreSQL database username     |
| `POSTGRES_PASSWORD`    | PostgreSQL database password     |
| `DJANGO_SECRET_KEY`    | Django secret key                |
| `DJANGO_DEBUG`         | Django debug setting             |
| `DJANGO_ALLOWED_HOSTS` | Allowed Django hostnames         |
| `DB_NAME`              | Database name used by Django     |
| `DB_USER`              | Database username used by Django |
| `DB_PASSWORD`          | Database password used by Django |
| `DB_HOST`              | Database hostname                |
| `DB_PORT`              | Database port                    |
| `VITE_API_URL`         | Frontend API base URL            |

The frontend's API URL is currently configured directly in `compose.yaml`:

```yaml
environment:
  VITE_API_URL: http://localhost:8000
```

This is appropriate for local development where the browser accesses the backend through the host machine.

---

## Docker Development

The Compose configuration defines three services.

### Backend

The Django application runs on port `8000`.

```yaml
backend:
  build:
    context: ./backend
  command: python manage.py runserver 0.0.0.0:8000
```

The backend source code and uploaded media directory are mounted into the container.

### Frontend

The React application runs on port `5173` using Vite.

```yaml
frontend:
  build:
    context: ./frontend
  command: npm run dev -- --host 0.0.0.0
```

Frontend dependencies are maintained in a named Docker volume to avoid conflicts with the host environment.

### Database

The database uses the official PostgreSQL 17 Alpine image.

```yaml
db:
  image: postgres:17-alpine
```

Database data is persisted using the `postgres_data` named volume.

The database health check ensures PostgreSQL is ready before the backend starts.

### Docker Volumes

| Volume                  | Purpose                       |
| ----------------------- | ----------------------------- |
| `postgres_data`         | Persistent PostgreSQL data    |
| `frontend_node_modules` | Frontend Node.js dependencies |
| `./media`               | Uploaded application media    |

---

## Running Without Docker

It is also possible to run the frontend and backend independently.

### Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it.

Windows:

```powershell
venv\Scripts\activate
```

Linux:

```bash
source venv/bin/activate
```

Install the backend dependencies using the project's requirements file:

```bash
pip install -r requirements/base.txt
```

Configure the environment variables and ensure PostgreSQL is running.

Run migrations:

```bash
python manage.py migrate
```

Start Django:

```bash
python manage.py runserver
```

### Frontend

In another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
```

Start Vite:

```bash
npm run dev
```

---

## Useful Commands

### Docker

| Command                           | Description                      |
| --------------------------------- | -------------------------------- |
| `docker compose up -d`            | Start services in the background |
| `docker compose up --build`       | Build and start services         |
| `docker compose down`             | Stop and remove containers       |
| `docker compose ps`               | List running services            |
| `docker compose logs -f`          | Follow service logs              |
| `docker compose logs -f backend`  | Follow backend logs              |
| `docker compose logs -f frontend` | Follow frontend logs             |
| `docker compose restart backend`  | Restart backend                  |

### Django

Run migrations:

```bash
docker compose exec backend python manage.py migrate
```

Create migrations:

```bash
docker compose exec backend python manage.py makemigrations
```

Create a superuser:

```bash
docker compose exec backend python manage.py createsuperuser
```

Open the Django shell:

```bash
docker compose exec backend python manage.py shell
```

Run tests:

```bash
docker compose exec backend python manage.py test
```

### React

Run ESLint:

```bash
cd frontend
npm run lint
```

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## Ticket Generation

Tickets are generated as PDF documents using ReportLab.

Each ticket includes a QR code that can be scanned by the application's check-in interface.

Ticket backgrounds support two options:

1. **Custom event backdrop:** An image uploaded specifically for an event.
2. **Default backdrop:** A shared default image used when no custom backdrop is configured.

The event banner and ticket backdrop are independent assets. Updating one does not replace the other.

The default ticket backdrop is stored in:

```text
backend/static/tickets/default_backdrop.png
```

---

## Development Guidelines

When making changes to the application:

1. Keep frontend and backend responsibilities separate.
2. Use Django REST Framework serializers for API validation.
3. Keep API requests inside the frontend service layer.
4. Use React Query hooks for server-state management.
5. Use environment variables for configuration.
6. Create and apply Django migrations when models change.
7. Test PDF generation and QR code scanning when modifying ticket functionality.
8. Avoid committing generated files, secrets, or local environment configuration.

---

## Production Considerations

The current Compose configuration is intended for local development. It uses Django's development server and Vite's development server.

Before deploying to production, configure:

- A production Django application server, such as Gunicorn.
- A production frontend build served through an appropriate web server.
- HTTPS and secure cookies.
- Production Django settings and allowed hosts.
- Persistent database and media storage.
- Static file collection and serving.
- Database and media backups.
- Appropriate logging and monitoring.
- A secure method of managing production secrets.

Do not expose the PostgreSQL database publicly unless there is a specific operational requirement and appropriate access controls.

---

## License

This project is developed for Oxbridge International School. Distribution, reuse, and modification should be subject to the school's approval.
