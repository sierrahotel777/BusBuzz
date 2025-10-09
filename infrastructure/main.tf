# main.tf

# 1. Provider and Version Configuration
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# --- RESOURCE GROUP ---
# Resource Group location is West US 2 (matching Cosmos DB and SWA)
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.db_location
}

# -------------------------------------------------------------------------------------
# 2. BACKEND APP SERVICE COMPONENTS (HOSTED IN EAST US)
# -------------------------------------------------------------------------------------

# 2a. App Service Plan (Linux - Basic B1 SKU)
resource "azurerm_service_plan" "backend_plan" {
  name                = "busbuzz-backend-plan-wus2"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.backend_location
  os_type             = "Linux"
  sku_name            = var.backend_sku
}

# 2b. Linux Web App (The Docker Host)
resource "azurerm_linux_web_app" "backend_app" {
  name                = "busbuzz-api-live-eus"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_service_plan.backend_plan.location
  service_plan_id     = azurerm_service_plan.backend_plan.id

  site_config {
    # Default setting for custom container
    always_on = true
  }

  app_settings = {
    # CRITICAL: These are the application environment variables
    "WEBSITES_PORT"                    = "5000"
    "MONGO_DB_CONNECTION_STRING"       = "YOUR_COSMOS_DB_CONNECTION_STRING" 
    "JWT_SECRET"                       = "YOUR_GENERATED_JWT_SECRET"       
    "DOCKER_REGISTRY_SERVER_URL"       = azurerm_container_registry.acr.login_server
    # ACR credentials must be set as App Settings (not shown here for security)
  }
}

# 2c. Container Registry (ACR)
resource "azurerm_container_registry" "acr" {
  name                = "busbuzzacr002"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.backend_location
  sku                 = var.acr_sku
  admin_enabled       = true
}

# -------------------------------------------------------------------------------------
# 3. FRONTEND STATIC WEB APP (HOSTED IN WEST US 2)
# -------------------------------------------------------------------------------------

resource "azurerm_static_web_app" "frontend_app" {
  name                = "busbuzz-frontend-cli"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.frontend_location
  sku_tier            = var.swa_sku
  
  # NOTE: The 'Source' is set to 'Other' by omitting the source_repository field,
  # allowing manual CLI deployment via Service Principal.
}

# -------------------------------------------------------------------------------------
# 4. AZURE COSMOS DB FOR MONGODB (HOSTED IN WEST US 2)
# -------------------------------------------------------------------------------------

resource "azurerm_cosmosdb_account" "cosmos_db" {
  name                = "busbuzz-cosmos-live"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.db_location
  offer_type          = "Standard"
  kind                = "MongoDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = var.db_location
    failover_priority = 0
  }

  capabilities {
    name = "EnableMongo"
  }
}

# 4b. Cosmos DB Database (BusBuzzDB) and Collection (Users)
resource "azurerm_cosmosdb_mongodb_database" "mongodb_db" {
  name                = "BusBuzzDB"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_db.name
}

resource "azurerm_cosmosdb_mongodb_collection" "users_collection" {
  name                = "Users"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_db.name
  database_name       = azurerm_cosmosdb_mongodb_database.mongodb_db.name
  shard_key           = "_id" 
}