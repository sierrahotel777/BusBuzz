terraform {
  required_version = ">= 1.3.0"

  backend "azurerm" {
    resource_group_name  = "bussbuzz-rg"
    storage_account_name = "bussbuzzstate"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.117"
    }
  }
}
