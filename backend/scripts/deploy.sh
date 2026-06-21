#!/bin/bash

# AudioStreaming Deployment Script
# This script helps deploy the application to various platforms

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check if required commands exist
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All requirements met"
}

# Run tests before deployment
run_tests() {
    print_info "Running tests..."
    
    if npm run test; then
        print_success "All tests passed"
    else
        print_error "Tests failed. Deployment aborted."
        exit 1
    fi
}

# Build the application
build_app() {
    print_info "Building application..."
    
    if npm run build:prod; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Deploy to Heroku
deploy_heroku() {
    print_info "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed"
        print_info "Install it from: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check if Heroku app exists
    if ! heroku apps:info &> /dev/null; then
        print_warning "No Heroku app found. Creating one..."
        heroku create
    fi
    
    # Set environment variables
    print_info "Setting environment variables..."
    heroku config:set NODE_ENV=production
    
    # Deploy
    git push heroku main
    
    # Run migrations if needed
    # heroku run npm run migrate
    
    print_success "Deployed to Heroku successfully"
    heroku open
}

# Deploy using Docker
deploy_docker() {
    print_info "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Build Docker image
    print_info "Building Docker image..."
    docker build -t audiostreaming:latest .
    
    # Stop existing container if running
    docker stop audiostreaming 2>/dev/null || true
    docker rm audiostreaming 2>/dev/null || true
    
    # Run container
    print_info "Starting Docker container..."
    docker run -d \
        --name audiostreaming \
        -p 8004:8004 \
        --env-file .env.production \
        --restart unless-stopped \
        audiostreaming:latest
    
    print_success "Docker deployment completed"
    print_info "Container is running at http://localhost:8004"
}

# Deploy using Docker Compose
deploy_docker_compose() {
    print_info "Deploying with Docker Compose..."
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Stop existing services
    docker-compose down
    
    # Build and start services
    docker-compose up -d --build
    
    print_success "Docker Compose deployment completed"
    print_info "Services are running"
    docker-compose ps
}

# Deploy to DigitalOcean
deploy_digitalocean() {
    print_info "Deploying to DigitalOcean..."
    
    if ! command -v doctl &> /dev/null; then
        print_error "DigitalOcean CLI (doctl) is not installed"
        print_info "Install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi
    
    print_warning "Please ensure you have:"
    print_warning "1. Created a DigitalOcean App"
    print_warning "2. Connected your GitHub repository"
    print_warning "3. Set environment variables in the App settings"
    
    print_info "Triggering deployment..."
    # This assumes you have an app already created
    # doctl apps create-deployment <app-id>
    
    print_success "Deployment triggered on DigitalOcean"
}

# Deploy to AWS (basic guide)
deploy_aws() {
    print_info "AWS Deployment Guide:"
    print_info "1. Create an EC2 instance"
    print_info "2. SSH into the instance"
    print_info "3. Clone your repository"
    print_info "4. Install Node.js and npm"
    print_info "5. Install PM2: npm install -g pm2"
    print_info "6. Set environment variables"
    print_info "7. Build: npm run build:prod"
    print_info "8. Start with PM2: pm2 start dist/server.js --name audiostreaming"
    print_info "9. Setup PM2 startup: pm2 startup && pm2 save"
    print_info "10. Configure nginx as reverse proxy"
    print_info "11. Setup SSL with Let's Encrypt"
}

# Health check
health_check() {
    print_info "Running health check..."
    
    local url="${1:-http://localhost:8004/api/health}"
    
    if curl -f -s "$url" > /dev/null; then
        print_success "Health check passed"
        curl -s "$url" | jq '.' || curl -s "$url"
    else
        print_error "Health check failed"
        exit 1
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║   AudioStreaming Deployment Script    ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Select deployment target:"
    echo "1) Heroku"
    echo "2) Docker (local)"
    echo "3) Docker Compose (with MongoDB)"
    echo "4) DigitalOcean"
    echo "5) AWS (guide)"
    echo "6) Build only"
    echo "7) Run tests only"
    echo "8) Health check"
    echo "9) Exit"
    echo ""
}

# Main script
main() {
    check_requirements
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        show_menu
        read -p "Enter your choice [1-9]: " choice
        
        case $choice in
            1)
                run_tests
                build_app
                deploy_heroku
                ;;
            2)
                run_tests
                build_app
                deploy_docker
                ;;
            3)
                run_tests
                deploy_docker_compose
                ;;
            4)
                run_tests
                build_app
                deploy_digitalocean
                ;;
            5)
                deploy_aws
                ;;
            6)
                build_app
                ;;
            7)
                run_tests
                ;;
            8)
                health_check
                ;;
            9)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid choice"
                exit 1
                ;;
        esac
    else
        # Command line mode
        case $1 in
            heroku)
                run_tests
                build_app
                deploy_heroku
                ;;
            docker)
                run_tests
                build_app
                deploy_docker
                ;;
            docker-compose)
                run_tests
                deploy_docker_compose
                ;;
            digitalocean)
                run_tests
                build_app
                deploy_digitalocean
                ;;
            aws)
                deploy_aws
                ;;
            build)
                build_app
                ;;
            test)
                run_tests
                ;;
            health)
                health_check "$2"
                ;;
            *)
                print_error "Unknown command: $1"
                print_info "Usage: $0 [heroku|docker|docker-compose|digitalocean|aws|build|test|health]"
                exit 1
                ;;
        esac
    fi
    
    print_success "Deployment process completed!"
}

# Run main function
main "$@"
