# **Architecture Design Document (ADD)**

### **V1.0**

Status: Approved  
Author: [Etienne Beaulac](mailto:etiennebeaulac@gmail.com)

### **1\. Introduction and Architectural Goals**

#### **1.1 Overview**

This document outlines the architecture for the WeBudget Minimum Viable Product (MVP). WeBudget is a personal finance management application designed to provide users with a consolidated view of their financial accounts. The MVP's primary function is to allow users to securely link their bank accounts via Plaid and view their aggregated account balances and transaction histories. This architecture is designed to serve as the foundation for a future cross-platform application suite (Web, iOS, Android).

#### **1.2 Architectural Drivers**

The design of the WeBudget backend is guided by the following key principles:

* **Low Cost:** The architecture must prioritize the use of open-source technologies and third-party services with robust free tiers to eliminate initial infrastructure costs during the bootstrapping phase.  
* **Scalability:** The system must be designed as a set of stateless components that can be scaled horizontally. This ensures the application can handle future user growth without requiring a fundamental redesign.  
* **Security:** As the system handles sensitive financial data, security is paramount. The architecture must incorporate industry-best practices for authentication, data transit, and storage to ensure user data is protected at all times.  
* **Maintainability:** The system will be divided into logical, decoupled components (frontend, backend API, database). This separation of concerns simplifies development, testing, and future updates.  
* **Cross-Platform Support:** The architecture centers on a unified REST API. This ensures that any client application—whether it's the initial React web app or future native mobile apps—can be built on top of a single, consistent backend.

### **2\. System Context Diagram**

This diagram provides a high-level overview of the WeBudget system and its interactions with users and external services.

* **Actors:**  
  * **Individual User:** The end-user of the WeBudget application.  
* **External Systems:**  
  * **Auth0:** Provides user authentication and identity management services.  
  * **Plaid:** Provides secure integration with financial institutions for data aggregation.

**Interactions:**

* The **Individual User** interacts with the **WeBudget System** via the client application.  
* The **WeBudget System** communicates with **Auth0** to authenticate and authorize users.  
* The **WeBudget System** communicates with **Plaid** to manage bank connections and retrieve financial data.

### **3\. Container Diagram**

This diagram zooms into the "WeBudget System" to show its major, independently deployable components.

* **Containers:**  
  1. **React Web Application:** A single-page application (SPA) that serves as the primary user interface for the MVP. It is responsible for all client-side rendering and logic.  
  2. **Node.js REST API:** The core of the backend. It handles synchronous business logic (e.g., handling user requests) and offloads long-running tasks to the Background Worker. This API is stateless.  
  3. **PostgreSQL Database:** The persistent data store for the application. It holds all application data and serves as a simple job queue for the MVP. *Note: This job queue implementation is a designed-for-replacement component, intended to be swapped with a dedicated service like RabbitMQ as load increases.*   
     * ***Note:** \*This job queue implementation is a designed-for-replacement component. The project will migrate to a dedicated service (e.g., RabbitMQ, AWS SQS) when monitoring reveals specific performance triggers, such as **job processing latency exceeding 60 seconds**, **a high rate of failures requiring complex retry logic**, or **database contention impacting API response times.***  
  4. **Background Worker:** A separate Node.js process responsible for handling asynchronous, long-running, and scheduled tasks.  
     * **Scalability:** Workers will use a transactional locking read (`SELECT ... FOR UPDATE SKIP LOCKED`) to ensure jobs are processed exactly once.  
     * **Retry Logic:** For failed transaction syncs, the worker will use an exponential backoff strategy (e.g., 1m, 5m, 15m). If a sync fails 4 consecutive times, it will be marked as `'ERROR'` and only re-attempted on the next scheduled 12-hour cycle.  
     * **UI Feedback Loop:** The final sync status of each Plaid Item (including `'ERROR'`) will be exposed via the API (e.g., in the `GET /accounts` response) to enable clear user feedback on the frontend.

Add diagram here

**Connections:**

* The **React Web App** makes secure HTTPS requests to the **Node.js REST API**.  
* The **Node.js REST API** reads from and writes to the **PostgreSQL Database**. It also adds jobs to a queue (represented by a table in the database) for the Background Worker.  
* The **Background Worker** polls the database for new jobs, executes them, and writes the results back to the database.  
* The **REST API** and **Background Worker** both make secure server-to-server API calls to **Auth0** and **Plaid**.

### **4\. Key Data Flow Diagram: Linking a New Bank Account (Asynchronous)**

This sequence illustrates the revised, asynchronous process for linking a bank account to prevent request timeouts and improve user experience.

1. **Client \-\> API (Request Link Token):** The user clicks "Add Account" in the **React Web App**. The app sends a POST /plaid/create\_link\_token request to the **Node.js API**, including the user's JWT.  
2. **API \-\> Plaid (Create Link Token):** The **Node.js API** validates the JWT and sends a link\_token/create request to the **Plaid API**.  
3. **Plaid \-\> API \-\> Client (Return Link Token):** Plaid returns a temporary link\_token, which the **Node.js API** forwards back to the **React Web App**.  
4. **Client \-\> Plaid (User Completes Plaid Link):** The **React Web App** uses the link\_token to initialize the Plaid Link UI. The user completes the flow, and Plaid returns a public\_token to the client.  
5. **Client \-\> API (Send Public Token):** The **React Web App** sends the public\_token to the **Node.js API** via a POST /plaid/exchange\_public\_token request.  
6. **API \-\> Plaid (Exchange for Access Token):** The **Node.js API** exchanges the public\_token with Plaid for a permanent access\_token and item\_id.  
7. **API \-\> Database (Store Securely):** The **Node.js API** encrypts the access\_token and saves the resulting ciphertext, item\_id, and other item details into the PlaidItems table in the **PostgreSQL Database**.  
8. **API \-\> Database (Queue Sync Job):** The **Node.js API** adds a new job to a dedicated jobs table in the database (e.g., {job\_type: 'INITIAL\_SYNC', item\_id: '...'} ).  
9. **API \-\> Client (Confirm Success):** The API immediately returns a 202 Accepted response to the **React Web App**, indicating the link was successful and that a background sync has begun. The UI can be updated to show the new institution in a "Syncing..." state.  
10. **Background Worker (Process Job):** The **Background Worker** process, polling the jobs table, picks up the INITIAL\_SYNC job. It decrypts the corresponding access\_token and performs the full data fetch from Plaid, populating the Accounts and Transactions tables. Upon completion, it updates the sync status of the Plaid Item in the database.

### **5\. Technology Stack Decisions**

| Component | Technology | Justification |
| :---- | :---- | :---- |
| **Frontend** | **React** | A modern, component-based library for building a dynamic and maintainable user interface. |
| **Backend API** | **Node.js \+ Express** | Excellent I/O performance for an API-heavy application. A vast ecosystem and official SDKs speed up development. |
| **Database** | **PostgreSQL** | A highly reliable relational database ideal for the structured and sensitive nature of financial data. |
| **Authentication** | **Auth0** | Offloads complex security implementation. Provides a robust, secure, and dedicated service with a generous free tier. |
| **Bank Integration** | **Plaid** | The industry standard for securely connecting to financial institutions. Its free developer tier is ideal for the MVP. |
| **Containerization** | **Docker** | Creates a consistent, portable, and isolated development environment that simplifies setup and deployment. |
| **DB Migrations** | **node-pg-migrate** | Enables version-controlled, automated, and repeatable database schema changes, crucial for maintainability. |
| **Dependency Security** | **npm audit \+ Snyk/Dependabot** | Implements a "supply chain" security strategy by actively scanning for and managing vulnerable third-party packages. |

### 

### **6\. Security, Serviceability & Best Practices**

#### **6.1 Authentication Flow**

Authentication is managed by Auth0, with the Node.js API setting a JWT in a **secure, `HttpOnly` cookie**. The cookie must be set with the `SameSite=Strict` or `SameSite=Lax` attribute to provide a strong, browser-level defense against Cross-Site Request Forgery (CSRF) attacks.

#### **6.2 API Authorization**

An Express middleware will validate the JWT from the cookie on every request. The user's unique ID (sub claim) from the token will be used in all database queries to enforce strict data-access policies.

#### **6.3 Data Security**

* **Encryption at Rest (Application-Level Encryption):** Plaid `access_tokens` will be encrypted in the application using **AES-256-GCM** before being stored in the database. The encryption key will be managed via **environment variables**.  
* **Key Management:** For the MVP, the master encryption key will be managed via **environment variables**.  
  * **Future Consideration:** Before the first public deployment, this key must be migrated to a dedicated secrets management service (e.g., HashiCorp Vault, AWS Secrets Manager) to adhere to production security standards.  
* **Encryption in Transit:** All communication between all components and services will use **HTTPS (TLS)**.

**6.4 Data Integrity & Handling**

* **Deletion Policy:** The `DELETE /institutions/{institutionId}` endpoint will perform a soft delete by setting an `archived_at` timestamp. All data retrieval queries must filter for records where `archived_at` is `NULL`. A background job will permanently delete these records and their associated data after 90 days.  
* **Transaction Atomicity:** When linking a new item, the database operations to (1) save the encrypted `access_token` and (2) queue the `INITIAL_SYNC` job **must be performed within a single database transaction** to prevent partial data states.  
* **User Data Preservation:** Transaction synchronization logic must be designed to be non-destructive to user-generated content. When transaction data is refreshed from Plaid, existing user-defined fields like `notes` and `userCategoryId` must be preserved.

#### **6.5 Operational Security**

* **Rate Limiting**: Specific limits will be enforced to prevent abuse  
  * **Global:** 100 requests/user/minute  
  * **Link Token Creation**: 5 requests/user/10 minutes  
  * **Manual Refresh**: 1 request/item/5 minutes  
* **Log Sanitization**: All logs must be scrubbed of PII and sensitive data. The mandatory scrub list includes: `user_id`, `email`, `full_name`, all Plaid tokens, `account_name`, `account_mask`, the raw Authorization header/JWT, `merchant_name`, and any address fields

#### **6.6 Serviceability**

* **Health Checks:** All backend containers will expose a `GET /health` endpoint to report their operational status and connectivity to dependencies.  
* **Configuration Management:** All operational variables (e.g., refresh intervals, lookback periods) will be managed via **environment variables**. Storing configuration in the database is out of scope for the MVP.  
* **Detailed Error Handling:** Plaid API errors will be categorized:  
  * **Actionable Errors (`ITEM_LOGIN_REQUIRED`):** The API will return a specific error code to the client, prompting the user to take action (e.g., "Reconnect your bank").  
  * **Transient Errors (`PRODUCT_NOT_READY`, `RATE_LIMIT_EXCEEDED`):** The API will log the detailed error for debugging but return a generic message to the client (e.g., "Could not connect to your bank. Please try again later.").
