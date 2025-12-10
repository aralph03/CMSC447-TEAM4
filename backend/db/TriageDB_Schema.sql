-- ==========================================================
-- Categories Table
-- ==========================================================
-- Stores FAQ categories (e.g., General Information, Undergraduate Academic Advising, Registration, Graduation, Graduate General Information, Forms, Events/News).
-- Each category must have a unique name.
CREATE TABLE Categories (
  Category_ID INT AUTO_INCREMENT PRIMARY KEY,      -- Unique identifier for each category
  Category_Name VARCHAR(100) NOT NULL UNIQUE       -- Category name must be unique
);


-- ==========================================================
-- Users Table
-- ==========================================================
-- Stores all system users (students, faculty, staff, visitors).
-- Roles define permissions (Admin = can edit FAQs/Forms).
CREATE TABLE Users (
  User_ID INT AUTO_INCREMENT PRIMARY KEY,          -- Unique identifier for each user
  Full_Name VARCHAR(150) NOT NULL,                 -- First + Last name
  User_Name VARCHAR(100) NOT NULL UNIQUE,          -- Unique login handle
  User_Email VARCHAR(255) NOT NULL UNIQUE,         -- Email must be unique
  User_Phone VARCHAR(20) DEFAULT NULL,             -- Phone contact (required for Admins, optional for Users)
  User_Password VARCHAR(255) DEFAULT NULL,             -- Store HASHED password, not plain text
  Password_Reset_Token VARCHAR(255) DEFAULT NULL,      -- Random token for password reset link
  Password_Reset_Expires DATETIME DEFAULT NULL,        -- Expiration time for token
  User_Role ENUM('Admin','User') NOT NULL DEFAULT 'User', -- Permissions: Admin vs Non-admin
  User_Type ENUM('Undergraduate Student','Graduate Student','Faculty','Prospective Student','Ph.D. Student','Visitor') DEFAULT NULL,
                                                   -- Roles defined by stakeholders
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Track when user was created
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP           -- Auto-update timestamp when user changes
);


-- ==========================================================
-- Forms Table
-- ==========================================================
-- Stores forms (e.g., Change Major Form).
-- Some forms may require staff contact for approval.
CREATE TABLE Forms (
  Form_ID INT AUTO_INCREMENT PRIMARY KEY,          -- Unique identifier for each form
  Form_Name VARCHAR(150) NOT NULL UNIQUE,          -- Form name must be unique
  Form_URL VARCHAR(255) NOT NULL,                  -- Direct link to the form (website link)
  requires_staff BOOLEAN NOT NULL DEFAULT FALSE,   -- Indicates if form requires staff handling
  staff_contact_id INT NULL,                       -- FK → Users (staff responsible for this form)
  Form_Target_User_Type ENUM('Faculty','Staff','Faculty & Staff','Graduate Student','Ph.D. Student') DEFAULT NULL,
  Form_last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP, -- Track last update time
  CONSTRAINT fk_staff_contact FOREIGN KEY (staff_contact_id)
    REFERENCES Users(User_ID)
    ON DELETE SET NULL                             -- If staff is deleted, set to NULL but keep form
);


-- ==========================================================
-- FAQs Table
-- ==========================================================
-- Stores FAQs (Questions + Answers).
-- FAQs are linked to Categories and optionally Forms or escalation staff.
CREATE TABLE FAQs (
  FAQ_ID INT AUTO_INCREMENT PRIMARY KEY,           -- Unique identifier for each FAQ
  Question TEXT NOT NULL,                          -- The actual FAQ question
  Answer TEXT,                                     -- The answer (optional, may be updated later)
  FAQ_Category_ID INT NOT NULL,                    -- FK → Categories (required)
  FAQ_Form_ID INT NULL,                            -- FK → Forms (optional link if form applies)
  Escalation_contact_ID INT NULL,                  -- FK → Users (staff contact if escalation needed)
  Target_User_Type ENUM('All','Undergraduate Student','Graduate Student','Faculty','Prospective Student','Ph.D. Student','Visitor') DEFAULT 'All',
  FAQ_last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,  -- Track last update time
  -- Relationships
  CONSTRAINT fk_faq_category FOREIGN KEY (FAQ_Category_ID)
    REFERENCES Categories(Category_ID)
    ON DELETE RESTRICT,                            -- Prevent deleting a Category if FAQs exist
  CONSTRAINT fk_faq_form FOREIGN KEY (FAQ_Form_ID)
    REFERENCES Forms(Form_ID)
    ON DELETE SET NULL,                            -- If form is deleted, unlink it from FAQ
  CONSTRAINT fk_escalation_contact FOREIGN KEY (Escalation_contact_ID)
    REFERENCES Users(User_ID)
    ON DELETE SET NULL                             -- If staff is deleted, unlink escalation contact
);


-- ==========================================================
-- Logs Table
-- ==========================================================
-- Stores a record of every user query and system response.
-- Used for analytics (question frequency, escalation tracking).
CREATE TABLE Logs (
  Log_ID INT AUTO_INCREMENT PRIMARY KEY,           -- Unique identifier for each log entry
  User_Log_ID INT NULL,                            -- FK → Users (user who asked the query)
  Category_ID INT NULL,                            -- FK → Category matched/logged  
  FAQ_ID INT NULL,                                 -- FK → FAQs (optional, for analytics)
  Query TEXT NOT NULL,                             -- The actual user question
  Response TEXT,                                   -- The chatbot/system response
  Status ENUM('Answered','Escalated','No answer') NOT NULL,
                                                   -- Tracks how query was handled
  Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- When the query occurred
  -- Relationships
  CONSTRAINT fk_log_user FOREIGN KEY (User_Log_ID)
    REFERENCES Users(User_ID)
    ON DELETE SET NULL,                                 -- Preserve logs even if user is deleted
  CONSTRAINT fk_log_category FOREIGN KEY (Category_ID)  -- Tracks category-level usage
    REFERENCES Categories(Category_ID)
    ON DELETE SET NULL,
  CONSTRAINT fk_log_faq FOREIGN KEY (FAQ_ID)            -- Link to specific FAQ if answered
    REFERENCES FAQs(FAQ_ID)
    ON DELETE SET NULL
);


-- ==========================================================
-- Indexes for Performance
-- ==========================================================
-- Composite index: speeds up log lookups by user + timestamp (reporting queries).
CREATE INDEX idx_logs_user_time ON Logs(User_Log_ID, Timestamp);

-- Full-text search index on FAQs for keyword-based queries
CREATE FULLTEXT INDEX idx_faq_text ON FAQs(Question, Answer);
