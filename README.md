# WeBudget - Personal Finance Management

A full-stack personal finance management application designed to provide users with a consolidated view of their financial accounts, built with a focus on operational excellence and scalability.

---

## Table of Contents

- [WeBudget - Personal Finance Management](#webudget---personal-finance-management)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Technology Stack](#technology-stack)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Step 1: Configuration](#step-1-configuration)
    - [Step 2: Launch \& Verification](#step-2-launch--verification)
  - [Project Structure](#project-structure)
  - [API Documentation](#api-documentation)
  - [Advanced Operations](#advanced-operations)
  - [Troubleshooting](#troubleshooting)

---

## Project Overview

The WeBudget monorepo contains the source code for the entire application suite. The backend is a secure, containerized Node.js API that serves as the single source of truth for all client applications (web, mobile).

---

## Technology Stack

-   **Runtime:** Node.js with TypeScript
-   **Framework:** Express.js
-   **Database:** PostgreSQL
-   **Containerization:** Docker & Docker Compose
-   **API Specification:** OpenAPI 3.0 (Swagger)
-   **Database Migrations:** `node-pg-migrate`

---

## Getting Started

Follow these steps to get the complete backend running locally. The entire stack is containerized, so no local installation of Node.js or PostgreSQL is required.

### Prerequisites

-   [**Docker Desktop**](https://www.docker.com/products/docker-desktop/): Must be installed and running.
-   [**Git**](https://git-scm.com/): Required for cloning the repository.

### Step 1: Configuration

This project uses a single `.env` file at the root of the project to manage all configuration and secrets.

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd webudget
    ```

2.  **Create your local `.env` file from the template:**
    ```bash
    cp .env.example .env
    ```

3.  **Edit the `.env` file** and fill in your secrets (Plaid keys, database password, etc.):
    * **`POSTGRES_PASSWORD`**

      * **What it is: The password for your local PostgreSQL database that runs inside Docker.**  
      * **How to get it: You create this yourself. Choose a secure, memorable password for your local development.**

    * **`PLAID_CLIENT_ID`**

      * **What it is: Your unique public identifier for the Plaid API.**  
      * **How to get it:**  
        1. **Go to the [Plaid Dashboard](https://dashboard.plaid.com/) and log in.**  
        2. **Navigate to the Team Settings \-\> Keys section.**  
        3. **You will see your `client_id` listed there. Copy and paste it.**

    * **`PLAID_SECRET`**

      * **What it is: Your private API key for a specific Plaid environment (Sandbox, Development, or Production). For our current work, we only need the Sandbox key.**  
      * **How to get it:**  
        1. **This is on the same Keys page in the Plaid Dashboard.**  
        2. **Make sure you copy the secret for the Sandbox environment.**

    * **`PLAID_ENV`**

      * **What it is: Tells the Plaid SDK which environment to connect to.**  
      * **How to get it: For all development and testing, this should be set to `sandbox`.**

    * **`JWT_SECRET`**

      * **What it is: A long, random, and secret string that our server will use to sign and verify JSON Web Tokens for user authentication. It must be kept private.**  
      * **How to get it: You need to generate this yourself. A good way to create a strong, random secret is by using `openssl` in your terminal:**  

```bash
openssl rand -base64 32
```

      * **This will generate a random 32-byte string. Copy the output and paste it as the value for `JWT_SECRET`.**

    * **`ENCRYPTION_KEY`**

      * **What it is: A 32-byte (64-character hexadecimal) key used for encrypting and decrypting sensitive data, like the Plaid `access_token`, in our database.**  
      * **How to get it: You must generate this yourself. It's critical that it's in the correct hex format. Use the following `openssl` command:**  

```bash
openssl rand -hex 32
```

      * **This will generate a random 64-character hex string. Copy and paste the output.**


### Step 2: Launch & Verification

Once your `.env` file is configured, launch the entire backend stack with a single command. **Database migrations will run automatically on startup.**

1.  **Launch the application:**
    ```bash
    docker-compose up --build
    ```
    This command builds the Docker images and starts the API, Database, and Docs containers. The `-d` flag can be added to run in detached (background) mode.

2.  **Verify the services are running:**
    * **Health Check:** Open your browser and navigate to `http://localhost:3000/health`. You should see a `{"status":"OK",...}` response.
    * **API Docs:** Navigate to `http://localhost:8080` to see the interactive Swagger API documentation.

---

## Project Structure

This is a monorepo containing multiple packages:

-   `/server`: The Node.js backend API.
-   `/client`: The React frontend application (or other clients).
-   `/docs`: OpenAPI specifications and related documentation.

---

## API Documentation

Interactive API documentation is automatically generated and served by the `docs` service. You can access the live Swagger UI to view all endpoints and test them directly from your browser at:

-   **URL:** `http://localhost:8080`

---

## Advanced Operations

For detailed operational tasks such as connecting to the database, creating backups, and restoring data, please refer to the complete **[Deployment & Operations Guide](https://docs.google.com/document/d/1iUnlbMwTnSa1zSi8jWQZVOUL3rS9D93f6wgDG4iW0Qg/edit?tab=t.m0fxy3py2v37)**.

---

## Troubleshooting

**Problem: The API is not responding or in a crash loop.**

This is often caused by a misconfiguration in your `.env` file.

1.  Check the container logs for specific error messages:
    ```bash
    docker-compose logs -f api
    ```
2.  If you see `password authentication failed`, your `DATABASE_URL` is likely incorrect.
3.  To perform a clean reset, stop the containers and **delete the database volume**:
    ```bash
    # Warning: This command is destructive and will erase all data.
    docker-compose down -v
    ```
4.  Carefully check your `.env` file for typos, then restart the application:
    ```bash
    docker-compose up --build
    ```