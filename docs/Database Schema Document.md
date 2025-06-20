[](./img/database_schema_diagram.png)

### **Guiding Principles**

This schema is designed with the following principles to ensure consistency, performance, and data integrity for a production-grade financial application.

1. **Naming Convention:** All database objects will use snake\_case.  
2. **Data Integrity:** We will use the most precise data types available (e.g., DECIMAL for money) and enforce relationships with foreign key constraints. We will use ENUM types where applicable to enforce state integrity at the database level.  
3. **Keys:** As a general rule, every table has a surrogate primary key named `id` of type `BIGSERIAL`. Exceptions are made where a stable, external natural key is more appropriate (e.g., the `users` table, which uses the ID from Auth0).  
4. **Timestamps:** All timestamp columns use TIMESTAMPTZ (timestamp with time zone).  
5. **Data Deletion Policy:**  
   * **Soft Deletes:** Key user-facing resources (users, plaid\_items) use an archived\_at column. This is the primary method for "deleting" data.  
   * **Operational Safety:** To prevent catastrophic accidental deletions, foreign key constraints will use ON DELETE RESTRICT instead of ON DELETE CASCADE. This forces the application logic to explicitly handle the deletion of child records before a parent can be hard-deleted, making it a deliberate, multi-step process.  
6. **Security:** Sensitive data is stored as encrypted binary data in a BYTEA column.

### **Custom Type Definitions (ENUMs)**

To align with Principle \#2 (Data Integrity), we define custom `ENUM` types for columns that have a fixed set of possible values. This enforces data consistency at the database level.

\`\`\`

\-- For the sync\_status column in the plaid\_items table

CREATE TYPE item\_status AS ENUM (

  'good',

  'syncing',

  'relink\_required',

  'error'

);

\-- For the status column in the background\_jobs table

CREATE TYPE job\_status AS ENUM (

  'queued',

  'running',

  'completed',

  'failed'

);

\-- For the type column in the accounts table, based on Plaid's official types

CREATE TYPE account\_type AS ENUM (

  'depository',

  'credit',

  'loan',

  'investment',

  'other'

);

\-- For the subtype column in the accounts table, based on Plaid's official subtypes

CREATE TYPE account\_subtype AS ENUM (

  'checking', 'savings', 'hsa', 'cd', 'money market', 'paypal', 'prepaid', 'credit card',

  'p2p', 'student', 'mortgage', 'home equity', 'line of credit', 'auto', 'business',

  'personal', '401a', '401k', '403b', '457b', '529', 'brokerage', 'cash isa',

  'education savings account', 'ebt', 'fixed annuity', 'gic', 'health reimbursement arrangement',

  'ira', 'isa', 'keogh', 'lif', 'life insurance', 'lira', 'lrif', 'lrsp',

  'non-taxable brokerage account', 'prif', 'rdsp', 'resp', 'rlif', 'rrif', 'rrsp',

  'sarsep', 'sep ira', 'simple ira', 'sipp', 'stock plan', 'thrift savings plan', 'tfsa',

  'trust', 'ugma', 'utma', 'variable annuity', 'pension', 'profit sharing plan',

  'retirement', 'roth', 'roth 401k', 'other'

);

\`\`\`

### **Table Definitions**

#### **1\. Table:** users

| Column Name | Data Type | Constraints & Notes |
| :---- | :---- | :---- |
| id | TEXT | **PRIMARY KEY**. The unique user ID from Auth0. |
| email | TEXT | NOT NULL, UNIQUE. |
| full\_name | TEXT | NULL. |
| profile\_image\_url | TEXT | NULL. |
| archived\_at | TIMESTAMPTZ | NULL. For soft-deleting users. |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |

#### **2\. Table:** plaid\_items

| Column Name | Data Type | Constraints & Notes |
| :---- | :---- | :---- |
| id | BIGSERIAL | **PRIMARY KEY**. |
| user\_id | TEXT | NOT NULL. **FOREIGN KEY** \-\> users(id) ON DELETE RESTRICT. |
| plaid\_item\_id | TEXT | NOT NULL, UNIQUE. |
| plaid\_access\_token | BYTEA | NOT NULL. The encrypted Plaid access token. |
| plaid\_institution\_id | TEXT | NOT NULL. |
| institution\_name | TEXT | NOT NULL. |
| institution\_logo | TEXT | NULL. |
| sync\_status | item\_status | NOT NULL. **Uses an ENUM type** |
| last\_successful\_sync | TIMESTAMPTZ | NULL. |
| last\_sync\_error\_message | TEXT | NULL. |
| archived\_at | TIMESTAMPTZ | NULL. |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |

#### **Indexes for `plaid_items`**

* An index will be created on the `user_id` column to optimize queries that filter items by user.

#### **3\. Table:** accounts

| Column Name | Data Type | Constraints & Notes |
| :---- | :---- | :---- |
| id | BIGSERIAL | **PRIMARY KEY**. |
| item\_id | BIGINT | NOT NULL. **FOREIGN KEY** \-\> plaid\_items(id) ON DELETE RESTRICT. |
| plaid\_account\_id | TEXT | NOT NULL, UNIQUE. |
| name | TEXT | NOT NULL. |
| mask | TEXT | NULL. |
| type | account\_type | NOT NULL. Uses the account\_type ENUM. |
| subtype | account\_subtype | NOT NULL. Uses the account\_subtype ENUM. |
| current\_balance | DECIMAL(28, 10\) | NOT NULL. |
| available\_balance | DECIMAL(28, 10\) | NULL. |
| credit\_limit | DECIMAL(28, 10\) | NULL. |
| currency\_code | TEXT | NULL. ISO 4217 code. |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |

#### **Indexes for `accounts`**

* An index will be created on the `item_id` column to optimize queries that join or filter accounts by their parent institution.

#### **4\. Table:** transactions

| Column Name | Data Type | Constraints & Notes |
| :---- | :---- | :---- |
| id | BIGSERIAL | **PRIMARY KEY**. |
| account\_id | BIGINT | NOT NULL. **FOREIGN KEY** \-\> accounts(id) ON DELETE RESTRICT. |
| user\_category\_id | BIGINT | NULL. **FOREIGN KEY** \-\> user\_categories(id) ON DELETE SET NULL. |
| plaid\_transaction\_id | TEXT | NOT NULL. The transaction ID from Plaid. Uniqueness is enforced per account via a composite index. |
| amount | DECIMAL(28, 10\) | NOT NULL. |
| currency\_code | TEXT | NULL. |
| date | DATE | NOT NULL. **PARTITION KEY**. |
| merchant\_name | TEXT | NULL. |
| merchant\_logo | TEXT | NULL. |
| detailed\_category | TEXT | NULL. |
| is\_pending | BOOLEAN | NOT NULL, DEFAULT FALSE. |
| transaction\_type | TEXT | NULL. |
| payment\_channel | TEXT | NULL. |
| notes | TEXT | NULL. |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |

Partitioning Strategy for transactions:

This table will be implemented as a Partitioned Table in PostgreSQL, using Range Partitioning on the date column.

* **Method:** A new child table will be created for each month of data (e.g., transactions\_2025\_06, transactions\_2025\_07).  
* **Benefit:** This keeps the most frequently accessed data (recent transactions) in smaller, more manageable tables, dramatically improving query performance, indexing, and maintenance operations. This is a highly scalable approach that prevents the table from becoming a bottleneck.

**Indexes and Constraints for `transactions`**

* **Uniqueness**: To enforce that a plaid\_transaction\_id is unique for each account\_id, a composite unique index will be created. Because this is a partitioned table, the partition key (date) must be part of the constraint: UNIQUE (account\_id, plaid\_transaction\_id, date).  
* **Foreign Key Performance**: An index will be created on the account\_id column to optimize queries filtering transactions by account. An additional index will be placed on user\_category\_id to speed up category-based lookups.

#### **5\. Table:** user\_categories

| Column Name | Data Type | Constraints & Notes |
| :---- | :---- | :---- |
| id | BIGSERIAL | **PRIMARY KEY**. |
| user\_id | TEXT | NOT NULL. **FOREIGN KEY** \-\> users(id) ON DELETE RESTRICT. |
| name | TEXT | NOT NULL. UNIQUE constraint on (user\_id, name). |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |

#### **Indexes for `user_categories`**

* An index will be created on the `user_id` column to optimize category lookups for a specific user.

#### **6\. Table:** background\_jobs

| Column Name | Data Type | Constraints & Notes |
| :---- | :---- | :---- |
| id | BIGSERIAL | **PRIMARY KEY**. |
| job\_type | TEXT | NOT NULL. |
| payload | JSONB | NULL. |
| status | job\_status | NOT NULL, DEFAULT 'queued'. **Uses an ENUM type** |
| last\_attempt\_at | TIMESTAMPTZ | NULL. |
| last\_error | TEXT | NULL. |
| attempts | INTEGER | NOT NULL, DEFAULT 0. |
| created\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |

**Scaling Strategy for** background\_jobs**:**

* **Archival:** An automated process should periodically move old (\> 30 days) 'completed' and 'failed' jobs to an archived\_background\_jobs table to keep the primary queue lean.  
* **Performance Indexing:** A **partial index** (CREATE INDEX idx\_jobs\_pending ON background\_jobs (created\_at) WHERE status \= 'queued';) will be created to ensure worker polling queries are instant, regardless of the number of historical jobs in the table.

#### **7\. Table:** exchange\_rates 

**Scope Note:** This table and its associated logic are designed for future multi-currency support and are considered **Post-MVP**. Implementation will be prioritized based on user feedback and business needs after the initial launch.

| Column Name | Data Type | Constraints & Notes |
| :---- | :---- | :---- |
| date | DATE | **PRIMARY KEY**. |
| base\_currency | TEXT | **PRIMARY KEY**. The base for all conversions (e.g., 'USD'). |
| target\_currency | TEXT | **PRIMARY KEY**. The currency to convert to (e.g., 'CAD'). |
| rate | DECIMAL(18, 10\) | NOT NULL. The conversion rate. |
| updated\_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW(). |

**Usage Note for** exchange\_rates**:**

* This table will be populated daily by a scheduled background job that fetches rates from a reliable financial data provider (e.g., Open Exchange Rates). It allows for historically accurate aggregation of funds across different currencies in user reports.

### **Relationships Summary**

This section describes the foreign key relationships and their cardinality, which define how the tables are connected.

* **`users` `1` \--to-- `N` `plaid_items`**  
  * **Description:** A single User can link many financial institutions (Items).  
  * **Implementation:** The `plaid_items.user_id` column references `users.id`.  
* **`users` `1` \--to-- `N` `user_categories`**  
  * **Description:** A single User can create many of their own custom spending categories.  
  * **Implementation:** The `user_categories.user_id` column references `users.id`.  
* **`plaid_items` `1` \--to-- `N` `accounts`**  
  * **Description:** A single linked Institution (Item) can contain many individual accounts.  
  * **Implementation:** The `accounts.item_id` column references `plaid_items.id`.  
* **`accounts` `1` \--to-- `N` `transactions`**  
  * **Description:** A single Account has a history of many transactions.  
  * **Implementation:** The `transactions.account_id` column references `accounts.id`.  
* **`user_categories` `1` \--to-- `N` `transactions`**  
  * **Description:** A single user-defined Category can be applied to many different transactions, allowing users to override Plaid's default categorization.  
  * **Implementation:** The `transactions.user_category_id` column references `user_categories.id`.
