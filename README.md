# Admin UI

A modern full-stack application built with Node.js microservice backend and React TypeScript frontend.

## Project Structure

```
admin-ui/
├── backend/          # Node.js microservice with TypeScript
├── frontend/         # React application with TypeScript
├── package.json      # Root package.json for workspace management
└── README.md         # This file
```

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js
- REST API architecture
- Development tools: nodemon, ts-node

### Frontend
- React 18
- TypeScript
- Modern build tools
- ESLint & Prettier

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (for containerized deployment)
- Make (optional, for convenient commands)

### Quick Start with Makefile (Recommended)
```bash
# Show all available commands
make help

# Quick development setup and start
make quick-dev

# Quick production setup and start
make quick-prod

# Development with hot reload
make dev

# Production deployment
make prod
```

### Local Development (without Docker)
```bash
# Install dependencies
npm install

# Start both servers
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

### Docker Deployment (Recommended)

#### Quick Setup
```bash
# Run the setup script
./docker-setup.sh
```

#### Development Environment
```bash
# Start development environment with hot reload
docker-compose --env-file .env.development --profile dev up --build

# Access:
# - Frontend: http://localhost:3000 (React dev server)
# - Backend: http://localhost:3001 (API server)
```

#### Production Environment
```bash
# Start production environment
docker-compose --env-file .env.production --profile prod up --build -d

# Access:
# - Application: http://localhost (Nginx + API proxy)
```

### Available Docker Commands

```bash
# Development (with hot reload)
docker-compose --env-file .env.development --profile dev up --build

# Production (optimized builds)
docker-compose --env-file .env.production --profile prod up --build -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Clean up everything
docker-compose down -v --rmi all
docker system prune -a
```

## Development Workflow

### Local Development
1. Backend API runs on `http://localhost:3001`
2. Frontend development server runs on `http://localhost:3000`
3. Frontend proxies API requests to backend during development

### Docker Development
1. Backend API runs on `http://localhost:3001`
2. Frontend development server runs on `http://localhost:3000`
3. Hot reload enabled for both frontend and backend
4. Volumes mounted for live code changes

### Docker Production
1. Backend API runs on `http://localhost:3001`
2. Frontend served via Nginx on `http://localhost:80`
3. Nginx reverse proxy handles API routing
4. Optimized production builds with multi-stage Docker builds
