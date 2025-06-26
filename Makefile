# Variables
DOCKER_REGISTRY=langgenius
WEB_IMAGE=$(DOCKER_REGISTRY)/dify-web
API_IMAGE=$(DOCKER_REGISTRY)/dify-api
VERSION=latest

# Custom registry variables (overridable)
CUSTOM_REGISTRY?=your-registry
CUSTOM_API_IMAGE=$(CUSTOM_REGISTRY)/dify-api
CUSTOM_FRONTEND_IMAGE=$(CUSTOM_REGISTRY)/dify-next-frontend
CUSTOM_PROXY_IMAGE=$(CUSTOM_REGISTRY)/rest-to-soap-proxy
CUSTOM_TAG?=latest

# Build Docker images
build-web:
	@echo "Building web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker build -t $(WEB_IMAGE):$(VERSION) ./web
	@echo "Web Docker image built successfully: $(WEB_IMAGE):$(VERSION)"

build-api:
	@echo "Building API Docker image: $(API_IMAGE):$(VERSION)..."
	docker build -t $(API_IMAGE):$(VERSION) ./api
	@echo "API Docker image built successfully: $(API_IMAGE):$(VERSION)"

# Custom builds for deployment
build-custom-api:
	@echo "Building custom API Docker image: $(CUSTOM_API_IMAGE):$(CUSTOM_TAG)..."
	docker build -t $(CUSTOM_API_IMAGE):$(CUSTOM_TAG) ./api
	@echo "Custom API Docker image built successfully: $(CUSTOM_API_IMAGE):$(CUSTOM_TAG)"

build-custom-frontend:
	@echo "Building custom frontend Docker image: $(CUSTOM_FRONTEND_IMAGE):$(CUSTOM_TAG)..."
	docker build -t $(CUSTOM_FRONTEND_IMAGE):$(CUSTOM_TAG) ./dify-next-frontend
	@echo "Custom frontend Docker image built successfully: $(CUSTOM_FRONTEND_IMAGE):$(CUSTOM_TAG)"

build-custom-proxy:
	@echo "Building custom proxy Docker image: $(CUSTOM_PROXY_IMAGE):$(CUSTOM_TAG)..."
	docker build -t $(CUSTOM_PROXY_IMAGE):$(CUSTOM_TAG) ./rest-to-soap-proxy
	@echo "Custom proxy Docker image built successfully: $(CUSTOM_PROXY_IMAGE):$(CUSTOM_TAG)"

# Push Docker images
push-web:
	@echo "Pushing web Docker image: $(WEB_IMAGE):$(VERSION)..."
	docker push $(WEB_IMAGE):$(VERSION)
	@echo "Web Docker image pushed successfully: $(WEB_IMAGE):$(VERSION)"

push-api:
	@echo "Pushing API Docker image: $(API_IMAGE):$(VERSION)..."
	docker push $(API_IMAGE):$(VERSION)
	@echo "API Docker image pushed successfully: $(API_IMAGE):$(VERSION)"

# Push custom images
push-custom-api:
	@echo "Pushing custom API Docker image: $(CUSTOM_API_IMAGE):$(CUSTOM_TAG)..."
	docker push $(CUSTOM_API_IMAGE):$(CUSTOM_TAG)
	@echo "Custom API Docker image pushed successfully: $(CUSTOM_API_IMAGE):$(CUSTOM_TAG)"

push-custom-frontend:
	@echo "Pushing custom frontend Docker image: $(CUSTOM_FRONTEND_IMAGE):$(CUSTOM_TAG)..."
	docker push $(CUSTOM_FRONTEND_IMAGE):$(CUSTOM_TAG)
	@echo "Custom frontend Docker image pushed successfully: $(CUSTOM_FRONTEND_IMAGE):$(CUSTOM_TAG)"

push-custom-proxy:
	@echo "Pushing custom proxy Docker image: $(CUSTOM_PROXY_IMAGE):$(CUSTOM_TAG)..."
	docker push $(CUSTOM_PROXY_IMAGE):$(CUSTOM_TAG)
	@echo "Custom proxy Docker image pushed successfully: $(CUSTOM_PROXY_IMAGE):$(CUSTOM_TAG)"

# Build all images
build-all: build-web build-api

# Build all custom images
build-all-custom: build-custom-api build-custom-frontend build-custom-proxy

# Push all images
push-all: push-web push-api

# Push all custom images
push-all-custom: push-custom-api push-custom-frontend push-custom-proxy

build-push-api: build-api push-api
build-push-web: build-web push-web

# Build and push all images
build-push-all: build-all push-all

# Build and push all custom images
build-push-all-custom: build-all-custom push-all-custom
	@echo "All custom Docker images have been built and pushed."

# Update registry name in docker-compose.yaml
update-registry:
	@if [ -z "$(REGISTRY)" ]; then \
		echo "Usage: make update-registry REGISTRY=your-registry-name"; \
		exit 1; \
	fi
	@echo "Updating docker-compose.yaml with registry: $(REGISTRY)"
	@./update-registry.sh $(REGISTRY)

# Deploy commands
deploy-build: build-all-custom
	@echo "Building all custom images for deployment"

deploy-push: push-all-custom
	@echo "Pushing all custom images for deployment"

deploy-all: build-push-all-custom
	@echo "Building and pushing all custom images for deployment"

# Phony targets
.PHONY: build-web build-api push-web push-api build-all push-all build-push-all \
        build-custom-api build-custom-frontend build-custom-proxy \
        push-custom-api push-custom-frontend push-custom-proxy \
        build-all-custom push-all-custom build-push-all-custom \
        update-registry deploy-build deploy-push deploy-all build-custom-api build-custom-frontend build-custom-proxy push-custom-api push-custom-frontend push-custom-proxy build-all-custom push-all-custom build-push-all-custom update-registry deploy-build deploy-push deploy-all
