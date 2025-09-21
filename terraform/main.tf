terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.5.0"
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "bussbuzz-rg"
  location = var.location
}

# App Service Plan
resource "azurerm_service_plan" "app_plan" {
  name                = "bussbuzz-app-plan"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "B1" # Basic tier, allows always_on
}

# Frontend Web App
resource "azurerm_linux_web_app" "frontend_app" {
  name                = "bussbuzz-frontend-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT"      = true
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = false
  }

  site_config {
    always_on = true
  }
}

# Backend Web App
resource "azurerm_linux_web_app" "backend_app" {
  name                = "bussbuzz-backend-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT"      = true
    "WEBSITES_NODE_DEFAULT_VERSION"       = "18-lts"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = false
  }

  site_config {
    always_on = true
  }
}

# Link Frontend App to GitHub repo
resource "azurerm_app_service_source_control" "frontend_source" {
  app_id     = azurerm_linux_web_app.frontend_app.id
  repo_url   = var.github_repo_url
  branch     = "main"
  use_manual_integration = true
}

# Link Backend App to GitHub repo
resource "azurerm_app_service_source_control" "backend_source" {
  app_id     = azurerm_linux_web_app.backend_app.id
  repo_url   = var.github_repo_url
  branch     = "main"
  use_manual_integration = true
}