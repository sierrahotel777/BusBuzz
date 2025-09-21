terraform {
  required_version = ">= 1.3.0"

  backend "azurerm" {
    resource_group_name   = "bussbuzz-rg"           # Your existing resource group
    storage_account_name  = "bussbuzzstate"         # Create a unique Azure Storage Account
    container_name        = "tfstate"               # Blob container for storing state
    key                   = "terraform.tfstate"     # The state file name
  }
}

provider "azurerm" {
  features {}
}
