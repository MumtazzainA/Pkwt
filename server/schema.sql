-- Create Users Table (for Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create PKWT Table (Contract Data)
CREATE TABLE IF NOT EXISTS pkwt (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    work_location VARCHAR(100),
    contract_number VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration VARCHAR(50),
    compensation_pay_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
