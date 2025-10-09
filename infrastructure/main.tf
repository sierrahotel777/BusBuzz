# infrastructure/main.tf

# 1. Configure the Azure Provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}
# Helper to generate a secure JWT secret key
resource "random_string" "jwt_secret_key" {
  length  = 64
  special = true
  # Define a set of special characters to include for complexity
  override_special = "!@#$&*%" 
}
# Provider configuration (connects to your Azure account)
provider "azurerm" {
  features {}
}

# Helper to ensure unique resource names
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
  numeric = true
}

# 2. Define the Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# 3. Define Azure Container Registry (ACR) for Docker images
resource "azurerm_container_registry" "acr" {
  name                = "busbuzzacr${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# 4. Define the App Service Plan (Compute for backend)
resource "azurerm_service_plan" "app_plan" {
  name                = "busbuzz-backend-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux" 
  sku_name            = var.app_service_sku
}

# 5. Define the Backend Linux Web App (Containerized Express API)
resource "azurerm_linux_web_app" "backend_app" {
  name                = "busbuzz-api-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.app_plan.id

  # Configuration for Docker deployment
  site_config {} # Empty site_config to use container settings

  app_settings = {
    # Credentials and server URL for the App Service to pull the Docker image
    "DOCKER_REGISTRY_SERVER_URL"      = azurerm_container_registry.acr.login_server
    "DOCKER_REGISTRY_SERVER_USERNAME" = azurerm_container_registry.acr.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD" = azurerm_container_registry.acr.admin_password
    
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false" # Best practice for containers
    
    # 1. APPLICATION ENVIRONMENT VARIABLES:
    
    # 💥 ACTION REQUIRED: Replace this placeholder with your actual MongoDB connection string!
    "MONGO_DB_CONNECTION_STRING"      = "PASTE_YOUR_MONGO_DB_CONNECTION_STRING_HERE" 
    
    # 2. Inject the securely generated JWT Secret
    "JWT_SECRET"                      = random_string.jwt_secret_key.result 
    
    # 3. CORS Setting: Allows the frontend domain to access the backend API
    "CORS_ORIGIN"                     = "https://${azurerm_static_web_app.frontend_app.default_host_name}" 
  }
  
  # Enable System-Assigned Identity for potential future access to other Azure services
  identity {
    type = "SystemAssigned"
  }
}

# 6. Define the Frontend Static Web App
resource "azurerm_static_web_app" "frontend_app" {
  name                = "busbuzz-frontend-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}


# 7. Outputs for CI/CD Pipeline

# Output the SWA deployment token needed for GitHub Actions (Frontend CI/CD)
output "static_web_app_deployment_token" {
  value     = azurerm_static_web_app.frontend_app.api_key
  sensitive = true
}

output "backend_api_url" {
  value = "https://${azurerm_linux_web_app.backend_app.default_hostname}" 
}

# Output the Backend App Service name needed for GitHub Actions
output "backend_app_name" {
  value = azurerm_linux_web_app.backend_app.name
}

# Output the ACR details needed for GitHub Actions (Backend CI/CD)
output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}
output "acr_username" {
  value = azurerm_container_registry.acr.admin_username
}
output "acr_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
}