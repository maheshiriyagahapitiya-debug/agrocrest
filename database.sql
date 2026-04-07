-- AGRO CREAST ERP Database Schema
CREATE DATABASE IF NOT EXISTS agro_erp;
USE agro_erp;

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    branchId VARCHAR(50) NOT NULL
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    membershipNo VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    telephone VARCHAR(20),
    idNo VARCHAR(20),
    age INT,
    birthday DATE,
    email VARCHAR(100),
    maritalStatus VARCHAR(20),
    nationality VARCHAR(50),
    assignedExecutiveId VARCHAR(50),
    createdAt DATETIME,
    status VARCHAR(20),
    FOREIGN KEY (assignedExecutiveId) REFERENCES employees(id)
);

-- Loans Table
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(50) PRIMARY KEY,
    customerId VARCHAR(50),
    amount DECIMAL(15, 2),
    interestRate DECIMAL(5, 2),
    termMonths INT,
    startDate DATE,
    status VARCHAR(20),
    executiveId VARCHAR(50),
    approvedBy VARCHAR(50),
    appraisalDetails TEXT,
    repaymentSchedule JSON,
    createdAt DATETIME,
    FOREIGN KEY (customerId) REFERENCES customers(id),
    FOREIGN KEY (executiveId) REFERENCES employees(id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    receiptNo VARCHAR(50) UNIQUE NOT NULL,
    loanId VARCHAR(50),
    amount DECIMAL(15, 2),
    date DATETIME,
    method VARCHAR(50),
    balanceAfter DECIMAL(15, 2),
    FOREIGN KEY (loanId) REFERENCES loans(id)
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    assignedToId VARCHAR(50),
    customerId VARCHAR(50),
    status VARCHAR(20),
    dueDate DATETIME,
    createdAt DATETIME,
    FOREIGN KEY (assignedToId) REFERENCES employees(id),
    FOREIGN KEY (customerId) REFERENCES customers(id)
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    quantity INT,
    unitPrice DECIMAL(15, 2),
    lastUpdated DATETIME
);

-- HR Documents Table
CREATE TABLE IF NOT EXISTS hr_documents (
    id VARCHAR(50) PRIMARY KEY,
    employeeId VARCHAR(50),
    type VARCHAR(50),
    date DATETIME,
    content TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id)
);

-- Initial Data
INSERT IGNORE INTO employees (id, name, designation, email, password, branchId) VALUES
('emp-1', 'Admin Manager', 'BranchManager', 'manager@agro.com', '123', 'B1'),
('emp-2', 'Alice Junior', 'JuniorExecutive', 'alice@agro.com', '123', 'B1'),
('emp-3', 'Bob Senior', 'SeniorExecutive', 'bob@agro.com', '123', 'B1'),
('emp-4', 'Charlie Cashier', 'Cashier', 'cashier@agro.com', '123', 'B1'),
('emp-5', 'David CRO', 'CustomerRelationOfficer', 'cro@agro.com', '123', 'B1'),
('emp-6', 'Eve Regional', 'RegionalManager', 'regional@agro.com', '123', 'B1'),
('emp-7', 'Grace HR', 'HRManager', 'hr@agro.com', '123', 'B1');

INSERT IGNORE INTO inventory (id, name, category, quantity, unitPrice, lastUpdated) VALUES
('i-1', 'Office Chairs', 'Furniture', 15, 5000, NOW()),
('i-2', 'Laptops', 'Electronics', 8, 120000, NOW());
