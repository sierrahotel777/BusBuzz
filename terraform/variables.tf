variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "client_id" {
  description = "Service Principal Client ID"
  type        = string
}

variable "client_secret" {
  description = "Service Principal Client Secret"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure Tenant ID"
  type        = string
}

variable "location" {
  description = "Azure Region"
  type        = string
  default     = "eastus"
}

variable "github_repo_url" {
  description = "GitHub repo URL for CI/CD"
  type        = string
}

variable "github_pat" {
  description = "GitHub Personal Access Token for private repo"
  type        = string
  sensitive   = true
}
