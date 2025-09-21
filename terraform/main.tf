provider "azurerm" {
  features {}

  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
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
  sku_name            = "B1"  # free F1 cannot use "always_on"
}

# Backend App
resource "azurerm_linux_web_app" "backend_app" {
  name                = "bussbuzz-backend-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  site_config {
    always_on = false
    linux_fx_version = "NODE|18-lts"
  }

  app_settings = {
    SCM_DO_BUILD_DURING_DEPLOYMENT      = "true"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
  }
}

# Frontend App
resource "azurerm_linux_web_app" "frontend_app" {
  name                = "bussbuzz-frontend-app"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  site_config {
    always_on = false
    linux_fx_version = "NODE|18-lts"
  }

  app_settings = {
    SCM_DO_BUILD_DURING_DEPLOYMENT      = "true"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
  }
}

# Connect to GitHub
resource "azurerm_app_service_source_control" "backend_source" {
  app_id = azurerm_linux_web_app.backend_app.id
  repo_url = var.github_repo_url
  branch = "main"
  use_manual_integration = true
}

resource "azurerm_app_service_source_control" "frontend_source" {
  app_id = azurerm_linux_web_app.frontend_app.id
  repo_url = var.github_repo_url
  branch = "main"
  use_manual_integration = true
}
