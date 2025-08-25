# Admin UI Makefile
# Convenient commands for development and deployment

.PHONY: help setup dev prod build test clean logs stop restart status

# Default target
help: ## Show this help message
	@echo "Admin UI - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Environment Variables:"
	@echo "  NODE_ENV=development|production (default: production)"
	@echo ""

# Setup and initialization
setup: ## Initialize project and create necessary files
	@echo "🔧 Setting up Admin UI project..."
	@chmod +x docker-setup.sh
	@./docker-setup.sh
	@if [ ! -f "./backend/.env" ]; then cp ./backend/.env.example ./backend/.env; fi
	@echo "✅ Setup complete!"

# Development commands
dev: ## Start development environment with hot reload
	@echo "🚀 Starting development environment..."
	@docker-compose --env-file .env.development --profile dev up --build

dev-detached: ## Start development environment in background
	@echo "🚀 Starting development environment (detached)..."
	@docker-compose --env-file .env.development --profile dev up --build -d

dev-local: ## Start local development without Docker
	@echo "🚀 Starting local development servers..."
	@npm install
	@npm run dev

# Production commands
prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	@docker-compose --env-file .env.production --profile prod up --build

prod-detached: ## Start production environment in background
	@echo "🚀 Starting production environment (detached)..."
	@docker-compose --env-file .env.production --profile prod up --build -d

# Build commands
build: ## Build all Docker images
	@echo "🔨 Building Docker images..."
	@echo "⚠️  If you encounter Docker Hub rate limiting, try: make build-retry"
	@docker-compose build

build-retry: ## Build with retry logic for Docker Hub rate limiting
	@echo "🔨 Building Docker images with retry logic..."
	@echo "🔄 Attempting to pull base images first..."
	@docker pull node:18-alpine || echo "⚠️  Pull failed, continuing with build..."
	@docker pull nginx:alpine || echo "⚠️  Pull failed, continuing with build..."
	@sleep 5
	@docker-compose build --no-cache

build-dev: ## Build development Docker images
	@echo "🔨 Building development Docker images..."
	@docker-compose --env-file .env.development build

build-prod: ## Build production Docker images
	@echo "🔨 Building production Docker images..."
	@docker-compose --env-file .env.production build

build-local: ## Build local project
	@echo "🔨 Building local project..."
	@npm install
	@npm run build

# Testing commands
test: ## Run tests
	@echo "🧪 Running tests..."
	@npm run test --workspace=backend
	@npm run test --workspace=frontend
	@npm run test --workspace=documents

test-backend: ## Run backend tests only
	@echo "🧪 Running backend tests..."
	@npm run test --workspace=backend

test-frontend: ## Run frontend tests only
	@echo "🧪 Running frontend tests..."
	@npm run test --workspace=frontend

test-documents: ## Run documents tests only
	@echo "🧪 Running documents tests..."
	@npm run test --workspace=documents

# Utility commands
logs: ## Show logs from all services
	@docker-compose logs -f

logs-backend: ## Show backend logs only
	@docker-compose logs -f backend

logs-frontend-dev: ## Show frontend development logs
	@docker-compose logs -f frontend-dev

logs-frontend-prod: ## Show frontend production logs
	@docker-compose logs -f frontend-prod

logs-documents: ## Show documents logs
	@docker-compose logs -f documents

stop: ## Stop all services
	@echo "🛑 Stopping all services..."
	@docker-compose down

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	@docker-compose down
	@docker-compose --env-file .env.development --profile dev up --build -d

restart-prod: ## Restart production services
	@echo "🔄 Restarting production services..."
	@docker-compose down
	@docker-compose --env-file .env.production --profile prod up --build -d

status: ## Show status of all containers
	@echo "📊 Container Status:"
	@docker-compose ps

# Maintenance commands
clean: ## Clean up containers, volumes, and images
	@echo "🧹 Cleaning up Docker resources..."
	@docker-compose down -v --rmi all
	@docker system prune -f

clean-all: ## Deep clean including unused Docker resources
	@echo "🧹 Deep cleaning all Docker resources..."
	@docker-compose down -v --rmi all
	@docker system prune -a -f
	@docker volume prune -f

# Docker troubleshooting
docker-login: ## Login to Docker Hub (helps with rate limiting)
	@echo "🔐 Logging into Docker Hub..."
	@echo "💡 This can help avoid rate limiting issues"
	@docker login

docker-info: ## Show Docker system information
	@echo "📊 Docker System Information:"
	@docker system info

docker-images: ## List all Docker images
	@echo "📦 Docker Images:"
	@docker images

pull-base-images: ## Pre-pull base images to avoid rate limiting
	@echo "⬇️  Pre-pulling base images..."
	@docker pull node:18-alpine
	@docker pull nginx:alpine

install: ## Install dependencies locally
	@echo "📦 Installing dependencies..."
	@npm install

update: ## Update dependencies
	@echo "🔄 Updating dependencies..."
	@npm update

# Health and monitoring
health: ## Check health of running services
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:3001/health || echo "❌ Backend health check failed"
	@curl -f http://localhost/health || echo "❌ Frontend health check failed"
	@curl -f http://localhost:3002/health || echo "❌ Documents health check failed"

# Database commands (for future use)
db-setup: ## Setup database (placeholder for future implementation)
	@echo "🗄️  Database setup not implemented yet"

# Deployment commands
deploy-staging: ## Deploy to staging environment
	@echo "🚀 Deploying to staging..."
	@echo "⚠️  Staging deployment not configured yet"

deploy-prod: ## Deploy to production
	@echo "🚀 Deploying to production..."
	@echo "⚠️  Production deployment not configured yet"

# Development utilities
shell-backend: ## Open shell in backend container
	@docker-compose exec backend sh

shell-frontend: ## Open shell in frontend container (if running)
	@docker-compose exec frontend-dev sh || docker-compose exec frontend-prod sh

shell-documents: ## Open shell in documents container
	@docker-compose exec documents sh

# Quick commands
quick-dev: setup dev-detached ## Quick start: setup + development environment
quick-prod: setup prod-detached ## Quick start: setup + production environment

all: stop clean build-retry dev-detached ## Complete rebuild: stop, clean, build with retry, start dev
