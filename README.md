# BusBuzz: Cloud-Based Transport Management Solution

BusBuzz is a full-stack web application designed to streamline student transport services. It provides modules for user authentication, feedback and complaints management, and a framework ready for advanced features like real-time tracking (future feature).

This solution is built using a modern, scalable, and secure cloud architecture, deployed automatically via GitHub Actions.

---

## 🚀 Key Technologies

This project is built on the following core technologies:

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React.js** | User interface (UI) with client-side routing, protected routes, and custom theming. |
| **Backend** | **Node.js, Express.js** | RESTful API for handling business logic, authentication, and database interaction. |
| **Database** | **Azure Cosmos DB** | Globally distributed, multi-model database used with the MongoDB API. |
| **Containerization** | **Docker** | Used to package the Node.js backend for consistent, portable deployment. |
| **Infrastructure** | **Azure App Service (Linux)** | Hosts the containerized backend API. |
| **Hosting** | **Azure Static Web Apps (SWA)** | Hosts the static React frontend files. |
| **DevOps** | **GitHub Actions** | Automated Continuous Integration/Continuous Deployment (CI/CD) pipelines. |

---

## 📋 Features

### Core Modules

* **Secure Authentication:** User registration is handled by the administrator (bulk upload). Login uses Email/Password validated against the database.
* **Role-Based Access Control (RBAC):** Routes are protected using JSON Web Tokens (JWTs) and user roles (`admin`, `student`).
* **Feedback & Complaints:** Students can submit structured feedback (ratings) or detailed complaints (category, comments) against specific bus routes/drivers.
* **Admin Management:** Administrators can view detailed feedback, update the status (`Open`, `In Progress`, `Resolved`), and add internal resolution notes (via the `FeedbackDetail` component).

---

## 💻 Setup and Installation

### A. Backend (API and Database)

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/sierrahotel777/BusBuzz.git](https://github.com/sierrahotel777/BusBuzz.git)
    cd BusBuzz/backend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env` in the `backend/` directory and add your secret keys and connection strings.

    ```dotenv
    # backend/.env
    
    # 💥 ACTION: Replace with your actual Azure Cosmos DB Connection String
    MONGO_DB_CONNECTION_STRING=mongodb+srv://<user>:<password>@<cluster-name>...
    
    # 💥 ACTION: Replace with your secure, generated key (e.g., 64-char hex string)
    JWT_SECRET=YOUR_SUPER_SECURE_JWT_SECRET
    ```

4.  **Run Locally (Testing Only):**
    ```bash
    node server.js
    ```
    The API should run on `http://localhost:5000`.

### B. Frontend (React)

1.  **Navigate to the Frontend Directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Local API URL:**
    Create a file named `.env.development.local` in the `frontend/` directory to point your local environment to the live Azure backend API.

    ```dotenv
    # frontend/.env.development.local

    # 💥 ACTION: Replace with the actual deployed URL of your Azure App Service
    REACT_APP_API_URL=[https://busbuzz-api-live.azurewebsites.net](https://busbuzz-api-live.azurewebsites.net) 
    ```

4.  **Run Locally:**
    ```bash
    npm start
    ```

---

## 🌐 Deployment Pipeline (CI/CD)

The entire application is deployed automatically using two GitHub Actions pipelines defined in the `.github/workflows` directory.

### 1. Azure Configuration (Manual Prerequisites)

The following Azure resources were created manually in the **`busbuzz-rg`** Resource Group, primarily in the **East US** region (due to initial quota constraints):

* **Backend Host:** Azure App Service (`busbuzz-api-live`) using the Basic (B1) Plan.
* **Frontend Host:** Azure Static Web App (`busbuzz-frontend`).
* **Registry:** Azure Container Registry (`busbuzzacr001`).

### 2. CI/CD Workflow Summary

| File | Component | Action Summary |
| :--- | :--- | :--- |
| `backend-ci-cd.yml` | **Backend API** | 1. Logs into Azure/ACR. 2. **Builds Docker image** (using `backend/Dockerfile`). 3. Pushes image to ACR. 4. Updates App Service to pull the new container image. |
| `frontend-ci-cd.yml` | **Frontend App** | 1. Checks out code. 2. **Injects `REACT_APP_API_URL`** (from GitHub Secrets). 3. Runs `npm install` and `npm run build`. 4. Deploys the static `build/` artifacts to Azure Static Web Apps. |

### 3. GitHub Secrets (Mandatory)

The pipelines require the following secrets to be defined in the GitHub repository settings:

| Secret Name | Purpose |
| :--- | :--- |
| `AZURE_CREDENTIALS` | Service Principal JSON for Azure login. |
| `ACR_USERNAME`, `ACR_PASSWORD`, `ACR_LOGIN_SERVER` | Credentials to push and pull Docker images from ACR. |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token for the Static Web App. |
| `BACKEND_API_URL` | The current production URL for the backend API. |

---

## 🏛️ Infrastructure as Code (IaC)

This project includes the **Terraform** configuration in the `infrastructure/` folder. While the initial Azure deployment was done manually due to quota limitations, these files represent the desired, automated, and version-controlled definition of the entire cloud environment.

***
