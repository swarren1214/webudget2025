# **WeBudget: Deployment & Operations Guide (Local Docker Environment)**

**Version:** 1.0

**Last Updated:** June 18, 2025

## **1. Introduction & System Overview**

### **1.1 Purpose**

This document provides all necessary instructions to set up, configure, deploy, and operate the WeBudget backend application in a local development environment. Following this guide ensures a consistent and repeatable setup, which is foundational for stable development and testing.

This guide is intended for a local setup on a host machine (e.g., a Mac mini) and is **not suitable for a public production deployment**.

### **1.2 Architecture Reminder**

This guide will start three Docker containers using docker compose:

1. `api`: The Node.js/Express backend server.  
2. `db`: The PostgreSQL database for persistent data storage.  
3. `docs`: A SwaggerUI container to view live API documentation.

## **2. Prerequisites**

The following software must be installed and running on the host machine before proceeding.

* [x] **Docker Desktop for Mac:** The core containerization software. Ensure the Docker engine is running.  
* [x] **Git:** For cloning the source code repository from version control.  
* [x] **A Text Editor:** For creating and editing the .env configuration file (e.g., VS Code, Sublime Text).  
* [x] **(Recommended) A Database Client:** A tool like [DBeaver](https://dbeaver.io/) or the psql command-line tool for interacting with the database.

## **3. First-Time Setup**

This is a one-time process to get the project onto the host machine and configured for its first run.

### **Step 1: Clone the Repository**

Open a terminal and run the following command to download the source code:

```bash
git clone <your-repository-url>  
cd webudget
```

### **Step 2: Create the Environment Configuration File**

The application is configured using environment variables defined in a single `.env` file. This file must be created from the provided template.

**Security Note:** The `.env` file is used for secrets management. It is listed in the project's `.gitignore` file, which prevents you from ever accidentally committing sensitive credentials (API keys, passwords) to the codebase. This is a critical security best practice.

```bash
# In the project's root directory  
cp .env.example .env
```

Now, open the newly created `.env` file and populate it with the required values.

| Variable | Description | Example / Action to Take |
| :---- | :---- | :---- |
| `POSTGRES_USER` | The username for the PostgreSQL database. | Keep the default myuser from the example file. |
| `POSTGRES_PASSWORD` | The password for the PostgreSQL database. | **Set a secure password.** |
| `POSTGRES_DB` | The name of the database to create. | Keep the default webudget_db. |
| `DATABASE_URL` | The full connection string used by the API. **It must use the variables above.** | postgresql://myuser:mysecretpassword@db:5432/webudget_db |
| `PORT` | The port on which the Node.js API server will run inside the container. | Keep the default 3000. |
| `PLAID_CLIENT_ID` | Your client ID from the Plaid dashboard. | Get this from your [Plaid Dashboard](https://dashboard.plaid.com/team/keys). |
| `PLAID_SECRET` | Your secret key for the Plaid Sandbox environment. | Get this from your Plaid Dashboard. |
| `JWT_SECRET` | A long, random, secret string for signing JSON Web Tokens (JWTs). | **Generate a new secure secret.** |
| `ENCRYPTION_KEY` | **Critical:** A 64-character hex key (32 bytes) for AES-256 encryption of Plaid tokens in the DB. | **Generate a new secure key.** Use the command: openssl rand -hex 32 |

### **Step 3: Initial Application Launch**

With the `.env` file configured, you can now launch the application. The startup process is fully automated: it will run database migrations first and then start the application server.

```bash
docker compose up --build
```

*This command will build the api image, start all services, and run database migrations automatically. You will see live logs in your terminal. There is no need for a separate migration command.*

### **Step 4: Verify Success**

Once the logs indicate the server has started, you can verify that everything is working correctly.

1. **Check the Health Endpoint:** Open your web browser and navigate to http://localhost:3000/health. This endpoint performs a deep health check to verify both server and database connectivity.  
    * A `200 OK` response with `{"status":"OK", ...}` indicates the API is running and can successfully communicate with the database.  
    * A `503 Service Unavailable` response indicates a problem with the database connection, which helps orchestrators correctly manage traffic.
2. **Check the API Docs:** Navigate to http://localhost:8080. The Swagger UI should load, displaying your API endpoints.

If both checks pass, the backend is fully set up and running.

## **4. Daily Operations**

### **Starting the Application**

To run the application in the background (detached mode):

```bash
docker compose up -d
```

*This will start the containers if they are stopped, or recreate them if they have changed, and leave them running in the background.*

### **Stopping the Application**

To safely shut down all running application containers:

```bash
docker compose down
```

**Warning:** To perform a full reset that **deletes the database**, use `docker compose down -v`. The `-v` flag is destructive and will permanently erase all data in your database volume. Only use this when you need a completely clean environment.

## **5. Common Operational Tasks**

### **Viewing Logs**

To view the real-time logs from a running container (essential for troubleshooting):

```bash
# Follow the logs from the API server  
docker compose logs -f api  
# Follow the logs from the database  
docker compose logs -f db
```

Press `Ctrl+C` to stop viewing the logs.

### **Deploying Code Updates**

When new code is available from the Git repository, the deployment process is simple and reliable.

```bash
# 1. Pull the latest code changes  
git pull origin main  
  
# 2. Re-build the API image and restart the services  
# The automated migration will run on startup.  
docker compose up --build -d
```

### **Database Management**

#### **Connecting to the Database**

To get a direct psql shell inside the db container for manual inspection or queries:

```bash
docker compose exec db psql -U myuser -d webudget_db
```

*(Replace `myuser` and `webudget_db` if you changed them in your `.env` file.)*

#### **Creating a Database Backup**

To create a `.sql` backup of the entire database, run this command from the host machine. The backup file will be saved in your current directory.

```bash
# Syntax: docker compose exec -T <service_name> pg_dump -U <user> -d <db> > <backup_file.sql>  
docker compose exec -T db pg_dump -U myuser -d webudget_db > webudget_backup_$(date +%Y-%m-%d).sql
```

#### **Restoring from a Backup**

To restore the database from a `.sql` file, all existing data will be dropped and replaced.

```bash
# Syntax: cat <backup_file.sql> | docker compose exec -T <service_name> psql -U <user> -d <db>  
cat webudget_backup_2025-06-18.sql | docker compose exec -T db psql -U myuser -d webudget_db
```

### **Monitoring**

The application exposes critical performance metrics in a Prometheus-compatible format. This allows for monitoring application health, performance, and error rates.

#### **Accessing Metrics**

The metrics endpoint is available at `GET /metrics`. You can view the raw output using `curl`:

```bash
curl http://localhost:3000/metrics
```

## **6. Troubleshooting**

### **Problem: The API is not responding on** http://localhost:3000

1. Check that the containers are running with `docker compose ps`.  
2. If they are running, check for errors during startup with `docker compose logs api`. This is often caused by a misconfiguration in the `.env` file or a failed migration.

### **Problem: The** api **container exits immediately or is in a crash loop.**

1. This is most often a password authentication failed error or a failing migration script.  
2. It means the `DATABASE_URL` in your `.env` file does not match the `POSTGRES_` variables, or a migration is consistently failing.  
3. **Solution:**  
   * Stop the containers: `docker compose down`  
   * **Completely reset the database volume:** `docker compose down -v`  
   * Carefully verify all variables in your `.env` file are correct.  
   * Restart the application (`docker compose up --build`).

### **Problem: Plaid connection fails with an "invalid credentials" error.**

1. Run `docker compose logs -f api` to view the error response from Plaid.  
2. Double-check that the `PLAID_CLIENT_ID` and `PLAID_SECRET` in your `.env` file are copied correctly from your Plaid dashboard and do not contain extra spaces or characters.
