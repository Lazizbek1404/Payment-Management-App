CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'uz',
  status VARCHAR(20) NOT NULL DEFAULT 'inactive',
  registered_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  telegram_id BIGINT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  installment_price INTEGER NOT NULL,
  number_of_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  monthly_payment INTEGER NOT NULL,
  remaining_balance INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'paying',
  next_payment_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  date DATE NOT NULL,
  month_number INTEGER NOT NULL,
  note TEXT,
  partial BOOLEAN DEFAULT FALSE,
  group_id UUID,
  cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at DATE,
  overpayment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
