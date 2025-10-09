# infrastructure/variables.tf

variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  default     = "busbuzz-rg"
}

variable "location" {
  description = "The Azure region to deploy to"
  type        = string
  default     = "East US"
}

variable "app_service_sku" {
  description = "The SKU for the App Service Plan (e.g., F1, B1, S1). Use 'F1' for Free tier."
  type        = string
  default     = "S1" 
}