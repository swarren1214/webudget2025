# **WeBudget: Backend Development Guide**

**Version:** 1.0 

**Status:** DRAFT

## **1. Guiding Philosophy**

The goal of this guide is to establish a set of conventions and best practices for developing the WeBudget backend. Our primary objective is to build a system that is **readable**, **maintainable**, **testable**, and **scalable**.

We adhere to SOLID principles and a Clean Architecture approach. Code should be self-documenting, and responsibilities should be clearly separated across different layers of the application.

## **2. Getting Started: Local Development Setup**

Before contributing, your local development environment must be set up and running. All necessary steps, including cloning the repository, Docker configuration, and launching the services, are detailed in the main project README file.

* **Primary Setup Guide:** **Project [`README.md`](../README.md)**

Please ensure you can successfully run the application and its associated tests locally before proceeding.

## **3. Development Workflow**

This section outlines the process for contributing code, from creating a branch to getting your changes merged. Following this workflow ensures consistency and a high standard of quality.

### **3.1 Git Branching Strategy**

To keep our repository organized, all branches should follow this format: `type/short-description-in-kebab-case`

* `type` must be one of the Conventional Commit types (`feat`, `fix`, `refactor`, `chore`, `docs`).  
* **Examples:**  
  * `feat/add-notes-to-transactions`  
  * `fix/plaid-sync-race-condition`  
  * `docs/update-dev-guide`

### **3.2 Pull Request (PR) Process**

Every PR must meet these criteria before it can be merged:

1. **Creation:** When a feature or fix is complete, open a PR against the `main` branch. The description will be auto-populated from our repository's PR template.  
2. **Title:** The PR title **must** follow our Conventional Commit format (e.g., `feat(api): add endpoint for transaction notes`).  
3. **Description:** The author must fill out all sections of the template, especially the "How to Test" steps, and complete the "Author's Checklist".  
4. **CI Checks:** All automated checks (linting, unit tests) triggered by the PR must pass before a review can be requested.  
5. **Code Review:** At least **one** approving review from another backend team member is required. The author must address all comments from the reviewer.  
6. **Merge Strategy:** We will use **"Squash and Merge"**. This keeps our `main` branch history clean, with one logical commit per feature or fix.

### **3.3 Request Validation Strategy**

* **Tool:** We will use **`zod`** for all request validation (`body`, `params`, and `query`).  
* **Implementation:** Validation logic should be handled in a dedicated **validation middleware**, which runs before the controller. This keeps the controller clean and focused on handling the request *after* it has been proven valid. If validation fails, the middleware is responsible for sending a `400 Bad Request` response with a detailed error message.

### **3.4 Shared Typing Rules**

* **Rule:** If a TypeScript `type` or `interface` is used in **more than one module**, it belongs in the `src/types` directory. If it is only used within a single file, it should be defined locally in that file.

## **4. Development Practices**

### **4.1 Code Style & Formatting**

To ensure consistency and eliminate debates over formatting, we will automate our code style.

* **Linter:** ESLint will be used to catch common errors and enforce stylistic rules. The configuration will be committed to the repository.  
* **Formatter:** Prettier will be used for all code formatting. We will configure it to run automatically on pre-commit hooks to ensure all code pushed to the repository is consistently formatted.

### **4.2 Commit Message Conventions**

To maintain a clean and readable version history, we will adhere to the [**Conventional Commits**](https://www.conventionalcommits.org/) specification. This allows for automated changelog generation and simplifies release management.

* **Format:** `<type>(<scope>): <subject>`  
* **Common Types:**  
  * `feat`: A new feature for the user.  
  * `fix`: A bug fix for the user.  
  * `refactor`: A code change that neither fixes a bug nor adds a feature.  
  * `chore`: Changes to the build process or auxiliary tools.  
  * `docs`: Documentation only changes.  
  * `test`: Adding missing tests or correcting existing tests.  
* **Examples:**

```
feat(api): add endpoint for manual transaction refresh
fix(auth): correct JWT validation for expired tokens
docs(guide): add section on commit conventions
```

## **5. Architectural Patterns**

Our backend follows a layered architecture to ensure a clear separation of concerns.

* **Controllers (`/src/controllers`):**  
  * **Responsibility:** To handle the HTTP request/response cycle and nothing more.  
  * They parse and validate incoming request data (bodies, params, queries).  
  * They call one or more services to perform the required business logic.  
  * They are responsible for sending the final HTTP response (e.g., `res.status(200).json(...)`).  
  * They should contain **no business logic**.  
* **Services (`/src/services`):**  
  * **Responsibility:** To contain all business logic.  
  * They orchestrate data from multiple sources, perform calculations, and enforce business rules.  
  * They are completely decoupled from the transport layer (Express). They should not know about `req` or `res` objects.  
  * They call repository functions to fetch and persist data.  
  * This is the primary layer for unit testing.  
* **Repositories (`/src/repositories`):**  
  * **Responsibility:** To abstract all data persistence logic. We will use the **Repository Pattern**. For each major data entity (e.g., `User`, `Transaction`), a corresponding `transaction.repository.ts` file will be created.  
  * This layer is the only part of the application that should have direct knowledge of the database schema and the `pg` driver.  
  * It exposes high-level functions for services to use (e.g., `findUserById(id)`, `createTransaction(data)`).

### **5.1 Dependency Management & Injection**

To ensure our components are decoupled and testable, we will use **Dependency Injection**. Services should not create their own dependencies (e.g., `new TransactionRepository()`). Instead, dependencies should be passed into the service's functions or constructor. This allows us to "inject" mock dependencies during testing and makes the code's structure transparent.

## **6. Directory Structure**

The backend source code will be organized as follows to reflect the architecture:

```
/server
├── /migrations          # Database migration scripts
├── /src
│   ├── /api
│   │   └── /routes      # All route definitions (health.routes.ts, v1.routes.ts, etc.)
│   ├── /config          # Database connections, etc. (database.ts)
│   ├── /controllers     # Request/response handlers (health.controller.ts)
│   ├── /repositories    # Data access logic (transaction.repository.ts)
│   ├── /services        # Business logic (health.service.ts, health.service.test.ts)
│   ├── /utils           # Reusable utility functions
│   ├── /types           # Custom TypeScript type definitions
│   ├── index.ts         # Server entry point
│   ├── logger.ts        # Pino logger configuration
│   └── metrics.ts       # Prometheus metrics configuration
└── ...

```

## **7. Configuration Management**

* All configuration (ports, database URLs, secret keys) **must** be managed via environment variables (e.g., a `.env` file).  
* No secrets should ever be hard-coded or committed to version control.  
* The application **must** validate its required environment variables on startup. If validation fails (e.g., a required key is missing), the application should exit immediately with a clear error message to prevent runtime errors. A library like `zod` can be used for this purpose.

## **8. Testing Philosophy**

We aim for a high degree of confidence in our code through a balanced testing strategy.

* **Unit Tests (`*.test.ts`):**  
  * **Location:** Co-located with the source file (e.g., `health.service.test.ts` lives next to `health.service.ts`).  
  * **Target:** The **Service** layer. All business logic must be unit-tested in isolation.  
  * **Method:** Use Jest. All external dependencies (like the repository layer) **must be mocked**. Tests should be fast and run without any network or DB connections.  
* **Integration Tests (Future):**  
  * **Target:** The **Controller** and **Route** layers.  
  * **Method:** Use a library like `supertest` to make actual HTTP requests to the running application and verify that the routes, controllers, and services work together correctly against a test database.

## **9. Error Handling Strategy**

Consistent error handling is crucial for a reliable API.

* **Custom Errors:** We will create a hierarchy of custom error classes (e.g., `NotFoundError`, `ValidationError`, `UnauthorizedError`) that extend the base `Error` class.  
* **Propagation:** Services should throw these custom errors when business rules are violated.  
* **Handling:** A global error-handling middleware will be responsible for catching all errors, logging them, and sending a standardized JSON error response to the client based on the type of error thrown.  
* **Standard Error Shape:** All error responses must conform to the following structure:

```
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested transaction with ID 'txn_123' was not found.",
    "requestId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
}
```

## **10. Logging Conventions**

* **Structured Logs:** All logs must be structured JSON, as configured with `pino`.  
* **Log Levels:**  
  * `error`: For unhandled exceptions or critical failures that require immediate attention.  
  * `warn`: For non-critical issues or potential problems (e.g., deprecated API usage).  
  * `info`: For significant application lifecycle events (e.g., "Server started", "Database connected") and key business transactions.  
  * `debug`: For detailed diagnostic information useful during development.  
* **Redaction:** No Personally Identifiable Information (PII) or secrets should ever be logged. We will maintain a list of redacted paths in `logger.ts`.
