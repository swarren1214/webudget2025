# **System Requirements**

### **V1.1**

Status: Approved  
Author: [Etienne Beaulac](mailto:etiennebeaulac@gmail.com)

## **1.0 Overview**

This document outlines the functional and non-functional requirements for the backend system of the WeBudget MVP. The backend will serve as the central API for all client applications (web, iOS, Android) and will be responsible for user authentication, secure integration with the Plaid API, and management of financial data.

## **2.0 System Architecture & Core Components**

The backend system will consist of three primary components:

* **RESTful API:** The core application logic, exposing endpoints for clients to consume.  
* **Database:** A persistent data store for all user and financial information.  
* **External Integrations:** Secure services for handling authentication (Auth0) and financial data aggregation (Plaid).

## **3.0 Core Data Entities**

The system must store and manage the following data models.

* **User:** Represents an individual who has authenticated with the application.  
  * **Attributes:**  
    * Unique User ID (from Auth0)  
    * Email  
    * Full Name  
    * Profile Image URL (optional)  
* **Plaid Item (Linked Institution):** Represents a user's connection to a single financial institution via Plaid. A User can have many Plaid Items.  
  * **Attributes:**  
    * Plaid Item ID  
    * Plaid Access Token (must be stored securely with encryption)  
    * Institution Name (e.g., "Chase Bank")  
    * Institution Logo  
    * Sync Status (e.g., good, error, relink\_required)  
    * Last Successful Sync Timestamp  
    * Last Sync Error Message (optional)  
* **Account:** Represents a single bank account (e.g., checking, savings, credit card) belonging to a Plaid Item. A Plaid Item can have many Accounts.  
  * **Attributes:**  
    * Plaid Account ID  
    * Account Name (e.g., "Joint Checking")  
    * Account Mask (e.g., "0766")  
    * Account Type (e.g., depository, credit)  
    * Account Subtype (e.g., checking, savings)  
    * Current Balance  
    * Available Balance (if applicable)  
    * Credit Limit (for credit accounts)  
* **Transaction:** Represents a single financial transaction associated with an Account. An Account can have many Transactions.  
  * **Attributes:**  
    * Plaid Transaction ID  
    * Amount (positive for income, negative for expenses)  
    * Date (date the transaction was posted)  
    * Merchant Name (e.g., "Taco Bell")  
    * Merchant Logo  
    * Primary Category (from Plaid, e.g., "Food and Drink")  
    * Detailed Category (from Plaid, e.g., "Restaurants")  
    * Pending Status (boolean)  
    * Transaction Type (e.g., special, place, digital)  
    * Payment Channel (e.g., online, in store)  
    * Notes (text, optional, user-defined)  
    * User Category ID (optional, foreign key to a future Categories table, allows overriding Plaid's category)

## **4.0 Functional Requirements**

### **4.1 User Authentication & Authorization**

* **4.1.1** The system must use Auth0 for user authentication. All API endpoints must be protected and require a valid JSON Web Token (JWT) from Auth0.  
* **4.1.2** The backend must validate the JWT on every request to identify the user and authorize access to their specific data only. A user must never be able to access another user's data.

### **4.2 Plaid Integration: Account Linking & Data Syncing**

* **4.2.1** The backend must provide an endpoint that generates and returns a link\_token for the frontend to initialize the Plaid Link module.  
* **4.2.2** The backend must provide an endpoint to receive a public\_token from the frontend, exchange it with Plaid for an access\_token and item\_id, and securely store this information.  
* **4.2.3** Upon linking a new Item, the system must perform an initial pull of that Item's Accounts and Transactions. The default lookback period for this initial transaction sync will be 30 days. This value must be stored in a configurable variable to be easily changed in the future.  
* **4.2.4** The system must handle ongoing transaction updates through two methods:  
  * **4.2.4.1** (Automatic Refresh): A background process must attempt to sync transactions for each valid Plaid Item on a periodic basis (e.g., every 12 hours). The refresh interval must be a configurable variable.  
  * **4.2.4.2** (Manual Refresh): The backend must provide an endpoint (POST /items/{item\_id}/refresh) to allow the user to trigger an immediate data sync for a specific institution.  
* **4.2.5** The system must gracefully handle ITEM\_LOGIN\_REQUIRED errors from Plaid. It must update the Plaid Item's Sync Status to 'relink\_required' and provide this status via the API so the frontend can prompt the user to re-authenticate the item.  
* **4.2.6** When the system syncs new or updated transaction data from Plaid, it must preserve any existing user-defined data on those transactions (e.g., `Notes`, `UserCategoryId`). The sync process must only update fields that originate from Plaid.

### **4.3 Accounts API Endpoints**

* **4.3.1** The backend must provide an endpoint (GET /accounts) that returns a list of all Accounts for the authenticated user.  
* **4.3.2** The data must be structured by institution (Plaid Item), matching the grouping shown in the UI mockups.  
* **4.3.3** The backend must provide an endpoint (DELETE /items/{item\_id}) soft delete to remove a linked institution and all of its associated accounts and transactions.

### **4.4 Transactions API Endpoints**

* **4.4.1** The backend must provide an endpoint (GET /transactions) that returns a list of all Transactions for the authenticated user, sorted by date descending.  
* **4.4.2** The endpoint must support pagination to handle large numbers of transactions efficiently.  
* **4.4.3** The endpoint must support filtering by Account, startDate, endDate, and a searchText query parameter to enable the functionality shown in the UI mockups.  
* **4.4.4** The system must be able to identify transactions that are transfers between a user's linked accounts. For the MVP, this will be achieved by filtering for transactions with Plaid's 'Transfer' category. This endpoint should be filterable (`GET /transactions?category=transfer`). **Note: This method is a baseline for the MVP and may not identify all internal transfers with 100% accuracy. A more robust heuristic-based matching system is planned for a future release.**

## **5.0 Non-Functional Requirements**

* **5.1 Security:** All sensitive data, especially Plaid access\_tokens, must be encrypted at rest in the database.  
* **5.2 Scalability:** The API should be designed to be stateless, allowing for horizontal scaling by running multiple instances of the application.  
* **5.3 Data Integrity:** The system must ensure that operations that involve multiple steps (e.g., linking a new item and fetching its accounts) are atomic to prevent partial data states.  
* **5.4 Error Handling:** The API must provide clear and consistent error messages to the client applications when a request fails.  
* **5.5 Performance:** The API should have a median response time of under 500ms for all read operations (GET requests) under normal load.  
* **5.6 Logging:** The system must log all critical errors and API requests/responses (without sensitive data) to a centralized logging service to facilitate debugging and monitoring.  
* **5.7 Backup & Recovery:** The database must be automatically backed up on a daily basis, with the ability to perform a point-in-time recovery to any point in the last 7 days.  
* **5.8 Data Retention**  
  * **5.8.1** When a user archives a linked institution (`Plaid Item`), the system will perform a soft delete.  
  * **5.8.2** The system must implement a scheduled background process that automatically hard-deletes any soft-deleted `Plaid Item` and all its associated `Accounts` and `Transactions` after a retention period of **90 days**.