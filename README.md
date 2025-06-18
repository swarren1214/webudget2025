# WeBudget - Personal Finance Management

A full-stack personal finance management application designed to provide users with a consolidated view of their financial accounts.

<!--
[![Build Status](...)]()
[![Code Coverage](...)]()
[![License: MIT](...)]()
-->

---

## Table of Contents

- [WeBudget - Personal Finance Management](#webudget---personal-finance-management)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Technology Stack](#technology-stack)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Step 1: Configuration](#step-1-configuration)
    - [**Step 2: Running the Application**](#step-2-running-the-application)
    - [**Step 3: Database Initialization**](#step-3-database-initialization)
  - [**API Documentation**](#api-documentation)
  - [**Troubleshooting**](#troubleshooting)
    - [**could not connect to postgres / password authentication failed**](#could-not-connect-to-postgres--password-authentication-failed)

---

## Project Overview

The WeBudget monorepo contains the source code for the entire application suite, including the backend API (`/server`) and frontend client (`/client`). The backend is designed as a secure, scalable, and containerized RESTful API that serves as the single source of truth for all client applications.

---

## Technology Stack

The backend is built with a modern, containerized technology stack:

-   **Runtime:** Node.js with TypeScript
-   **Framework:** Express.js
-   **Database:** PostgreSQL
-   **Containerization:** Docker & Docker Compose
-   **API Specification:** OpenAPI 3.0 (Swagger)
-   **Database Migrations:** `node-pg-migrate`

---

## Getting Started

Follow these steps to set up and run the complete backend development environment. The entire stack is containerized, so no local installation of Node.js or PostgreSQL is required.

### Prerequisites

-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) must be installed and running on your system.

### Step 1: Configuration

This project uses a single `.env` file at the root of the project to manage all configuration for all services, ensuring credentials are never out of sync.

In the project's root directory (`webudget/`), create your `.env` file from the example:

```bash
cp .env.example .env
```

Now, open the new .env file and fill in your secrets (Plaid keys, JWT secret, etc.).

### **Step 2: Running the Application**

Once your .env file is configured, launch the entire backend stack (API, Database, Docs Viewer) with a single command from the project root:

```bash
docker compose up --build
```

The services will be available at the following local endpoints:

* **API Server:** `http://localhost:3000`
* **API Documentation:** `http://localhost:8080`

### **Step 3: Database Initialization**

The first time you start the application, the database is created but its tables are not. Run the following command to execute the database migrations and build the schema:

```bash
docker-compose exec api npm run migrate:up
```

You only need to run this command once after the initial setup, or anytime new migration files are added to the project.

## **API Documentation**

Interactive API documentation is automatically generated and served by the docs service. You can access the live Swagger UI to view all endpoints and test them directly from your browser at:

* **URL:** `http://localhost:8080`

## **Troubleshooting**

### **could not connect to postgres / password authentication failed**

This error indicates a problem with your .env file configuration.

**Solution:**

1. Stop and completely reset the environment by running the down command with the `-v` flag. This removes the containers AND the database volume: `docker compose down -v`  
2. **Completely reset the database** by deleting the Docker volume: `docker volume rm webudget_postgres_data`  
3. Carefully check your `.env` file for any typos, especially in the `DATABASE_URL` string.  
4. Restart the application: `docker compose up --build`
5. Run the migration again: `docker compose exec api npm run migrate:up`