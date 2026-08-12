-- AUREX — PostgreSQL schema (raw SQL alternative to Prisma)

CREATE TYPE role AS ENUM ('USER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
CREATE TYPE plan_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE investment_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE deposit_method_type AS ENUM ('GCASH', 'MAYA', 'BANK_TRANSFER', 'CRYPTO', 'CUSTOM');

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  role            role NOT NULL DEFAULT 'USER',
  status          user_status NOT NULL DEFAULT 'ACTIVE',
  balance         NUMERIC(18, 2) NOT NULL DEFAULT 0,
  referral_code   TEXT NOT NULL UNIQUE,
  referred_by_id  TEXT REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by_id);

CREATE TABLE plans (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT,
  min_amount        NUMERIC(18, 2) NOT NULL,
  max_amount        NUMERIC(18, 2),
  daily_return_pct  NUMERIC(8, 4) NOT NULL,
  duration_days     INT NOT NULL,
  total_return_pct  NUMERIC(8, 4) NOT NULL,
  status            plan_status NOT NULL DEFAULT 'ACTIVE',
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE investments (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  plan_id         TEXT NOT NULL REFERENCES plans(id),
  amount          NUMERIC(18, 2) NOT NULL,
  daily_return    NUMERIC(18, 2) NOT NULL,
  total_expected  NUMERIC(18, 2) NOT NULL,
  earned_amount   NUMERIC(18, 2) NOT NULL DEFAULT 0,
  status          investment_status NOT NULL DEFAULT 'ACTIVE',
  start_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date        TIMESTAMPTZ NOT NULL,
  last_roi_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_plan ON investments(plan_id);
CREATE INDEX idx_investments_status ON investments(status);

CREATE TABLE deposit_methods (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            deposit_method_type NOT NULL,
  account_name    TEXT,
  account_number  TEXT,
  qr_image_url    TEXT,
  wallet_address  TEXT,
  instructions    TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deposits (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  method_id       TEXT REFERENCES deposit_methods(id),
  amount          NUMERIC(18, 2) NOT NULL,
  proof_image_url TEXT,
  reference_note  TEXT,
  status          transaction_status NOT NULL DEFAULT 'PENDING',
  admin_note      TEXT,
  reviewed_by_id  TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deposits_user ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);

CREATE TABLE withdrawals (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id),
  amount           NUMERIC(18, 2) NOT NULL,
  method_type      TEXT NOT NULL,
  account_details  TEXT NOT NULL,
  status           transaction_status NOT NULL DEFAULT 'PENDING',
  admin_note       TEXT,
  reviewed_by_id   TEXT,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

CREATE TABLE referrals (
  id                 TEXT PRIMARY KEY,
  referrer_id        TEXT NOT NULL REFERENCES users(id),
  referred_id        TEXT NOT NULL UNIQUE REFERENCES users(id),
  commission_rate    NUMERIC(8, 4) NOT NULL,
  commission_earned  NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

CREATE TABLE system_settings (
  id         TEXT PRIMARY KEY,
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL,
  label      TEXT,
  "group"    TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
