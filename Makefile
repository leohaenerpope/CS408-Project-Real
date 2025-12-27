# Makefile for managing Docker Compose in production mode and cleaning up

# Load environment variables from .env file
-include .env
GITHUB_ACTIONS_RUN ?= $(shell if [ -n "$(GITHUB_ACTIONS)" ]; then echo true; else echo false; fi)

.PHONY: env init up down build deploy clean validate help

env:
ifeq ($(GITHUB_ACTIONS_RUN), true)
	@echo "Running on GitHub Actions. Executing CI-specific commands."
	@echo "Loading .env files from GitHub Secrets..."
else
	@echo "Not running on GitHub Actions. Executing local commands."
	@if [ ! -f .env ]; then \
		echo "✘ .env file not found! Please create a .env file based on .env.example."; \
		exit 1; \
	else \
		echo "✔ .env file found."; \
	fi
endif

validate: env
	@echo "Authenticating Docker Hub credentials..."
	@echo $(DOCKER_PAT) | docker login -u $(DOCKER_USERNAME) --password-stdin > /dev/null 2>&1 || { \
			echo "✘ Docker Hub authentication failed."; \
			exit 1; \
	}
	@echo "✔ Docker Hub authentication successful.";
	@echo "Validating EC2 connection..."
	@chmod 400 "$(EC2_KEY_NAME)"
	@ssh -o StrictHostKeyChecking=no -i "$(EC2_KEY_NAME)" ubuntu@$(EC2_DEPLOY_HOST) 'echo "EC2 connection successful."' > /dev/null 2>&1 || { \
			echo "✘ EC2 connection failed."; \
			exit 1; \
	}
	@echo "✔ EC2 connection successful."
	@echo "Checking other environment variables..."
	@if [ -z "$(APP_VERSION)" ] || [ -z "$(APP_NAME)" ] || [ -z "$(EC2_DEPLOY_DIR)" ]; \
	then \
		echo "✘ APP_VERSION, APP_NAME, and EC2_DEPLOY_DIR must be set in .env file."; \
		exit 1; \
	else \
		echo "APP_NAME: $(APP_NAME)"; \
		echo "APP_VERSION: $(APP_VERSION)"; \
		echo "EC2_DEPLOY_DIR: $(EC2_DEPLOY_DIR)"; \
		echo "✔ All required environment variables are set."; \
	fi
init: env
	@echo "Initializing production setup..."
	@sed "s|__DOCKER_USERNAME__|$(DOCKER_USERNAME)|g; ;s|__APP_VERSION__|$(APP_VERSION)|g; s|__APP_NAME__|$(APP_NAME)|g" docker-compose-template.yml > docker-compose.yml
	@echo "Generated docker-compose.yml from template."
	@echo ssh -i "$(EC2_KEY_NAME)" ubuntu@$(EC2_DEPLOY_HOST) > ec2-ssh.sh
	@chmod +x ec2-ssh.sh
	@echo "Generated ./ec2-ssh.sh to connect to the EC2 instance."
	@echo "Production setup initialization complete."
up:
	docker compose up --build
down:
	docker compose down
build:
	docker compose build --no-cache
push:
	docker compose push
deploy:
	@echo "Deploying to EC2 instance at $(EC2_DEPLOY_HOST)..."
	@ssh -i "$(EC2_KEY_NAME)" ubuntu@$(EC2_DEPLOY_HOST) 'mkdir -p $(EC2_DEPLOY_DIR)'
	@scp -i "$(EC2_KEY_NAME)" docker-compose.yml ubuntu@$(EC2_DEPLOY_HOST):$(EC2_DEPLOY_DIR)/docker-compose.yml
	@ssh -i "$(EC2_KEY_NAME)" ubuntu@$(EC2_DEPLOY_HOST) 'cd $(EC2_DEPLOY_DIR) && docker compose pull && docker compose up -d --remove-orphans'
	@echo "Deployment complete. Access your application at:"
	@echo "http://$(EC2_DEPLOY_HOST)"
logs:
	@ssh -i "$(EC2_KEY_NAME)" ubuntu@$(EC2_DEPLOY_HOST) 'cd $(EC2_DEPLOY_DIR) && docker compose logs -f'
clean:
	docker compose down --rmi all --volumes --remove-orphans
	rm -rf ./data/
	cd app && make clean
help:
	@echo "Makefile commands:"
	@echo "  env      - Check if .env file exists"
	@echo "  init     - Initialize production setup by generating docker-compose.yml and ec2-ssh.sh"
	@echo "  validate - Validate Docker Hub and EC2 credentials in .env file"
	@echo "  up       - Start the Docker Compose services in production mode"
	@echo "  down     - Stop the Docker Compose services"
	@echo "  build    - Build Docker images and push to Docker Hub"
	@echo "  deploy   - Deploy the application to the EC2 instance"
	@echo "  logs     - View real-time logs from the EC2 instance"
	@echo "  clean    - Clean up Docker resources and data volumes"
	@echo "  help     - Show this help message"
