# variables.tf

# --- Resource Group and Location Variables ---

variable "resource_group_name" {
  description = "The name of the resource group (busbuzz-rec-rg)."
  type        = string
  default     = "busbuzz-rec-rg"
}

variable "backend_location" {
  description = "The Azure region for the App Service components (East US)."
  type        = string
  default     = "East US" 
}

variable "frontend_location" {
  description = "The Azure region for the Static Web App (West US 2)."
  type        = string
  default     = "West US 2"
}

variable "db_location" {
  description = "The Azure region for the Cosmos DB cluster and Resource Group (West US 2)."
  type        = string
  default     = "West US 2"
}

# --- SKU and Sizing Variables ---

variable "backend_sku" {
  description = "The SKU for the App Service Plan (B1)."
  type        = string
  default     = "B1"
}

variable "acr_sku" {
  description = "The SKU for the Azure Container Registry (Basic)."
  type        = string
  default     = "Basic"
}

variable "swa_sku" {
  description = "The SKU for the Static Web App."
  type        = string
  default     = "Standard"
}