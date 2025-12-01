import { PoolClient } from 'pg';

/**
 * Statements to initialize database schema. Keep in sync with deploy scripts.
 */
export const migrationStatements = `
  CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_ci ON users (LOWER(email));

  CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    cover_image_url TEXT,
    check_in_time TIME NOT NULL DEFAULT '08:00',
    check_out_time TIME NOT NULL DEFAULT '18:00',
    signal_percentage NUMERIC(5,2) NOT NULL DEFAULT 50 CHECK (signal_percentage >= 0 AND signal_percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    payed NUMERIC(12,2) NOT NULL CHECK (payed >= 0),
    status TEXT NOT NULL CHECK (status IN ('SIGNAL', 'FULL')),
    paid_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS roles_tenants (
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (role_id, tenant_id)
  );

  ALTER TABLE spaces
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaces' AND column_name = 'price_per_hour'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'spaces' AND column_name = 'price'
    ) THEN
      EXECUTE 'ALTER TABLE spaces RENAME COLUMN price_per_hour TO price';
    END IF;
  END
  $$;

  CREATE TABLE IF NOT EXISTS user_tenants (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tenant_id)
  );

  -- Ajustes retrocompatíveis para reservas
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'total_price'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'price'
    ) THEN
      EXECUTE 'ALTER TABLE reservations RENAME COLUMN total_price TO price';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'start_date'
    ) THEN
      EXECUTE 'ALTER TABLE reservations DROP COLUMN start_date';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'end_date'
    ) THEN
      EXECUTE 'ALTER TABLE reservations DROP COLUMN end_date';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'check_in_time'
    ) THEN
      EXECUTE 'ALTER TABLE reservations DROP COLUMN check_in_time';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'check_out_time'
    ) THEN
      EXECUTE 'ALTER TABLE reservations DROP COLUMN check_out_time';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'reservation_date'
    ) THEN
      EXECUTE 'ALTER TABLE reservations ADD COLUMN reservation_date DATE NOT NULL DEFAULT CURRENT_DATE';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'price'
    ) THEN
      EXECUTE 'ALTER TABLE reservations DROP COLUMN price';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'status'
    ) THEN
      EXECUTE 'ALTER TABLE reservations DROP COLUMN status';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'reservations' AND column_name = 'payment_id'
    ) THEN
      EXECUTE 'ALTER TABLE reservations ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'reservation_id'
    ) THEN
      EXECUTE 'ALTER TABLE payments DROP COLUMN reservation_id';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'total_amount'
    ) THEN
      EXECUTE 'ALTER TABLE payments ADD COLUMN total_amount NUMERIC(12,2) NOT NULL DEFAULT 0';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payments' AND column_name = 'payed'
    ) THEN
      EXECUTE 'ALTER TABLE payments ADD COLUMN payed NUMERIC(12,2) NOT NULL DEFAULT 0';
    END IF;

    EXECUTE 'DROP INDEX IF EXISTS reservations_space_date_unique';
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS reservations_space_date_unique ON reservations (space_id, reservation_date)';
  END
  $$;
`;

export const runMigrations = async (client: PoolClient) => {
  await client.query(migrationStatements);
};
