-- Apply this migration to every tenant database before deploying the feature.
CREATE TABLE IF NOT EXISTS leave_balance_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  balance_month DATE NOT NULL COMMENT 'First day of the policy month',
  opening_balance DECIMAL(8,2) NOT NULL DEFAULT 0,
  monthly_leave_credit DECIMAL(8,2) NOT NULL DEFAULT 1,
  paid_leave_used DECIMAL(8,2) NOT NULL DEFAULT 0,
  unpaid_leave_days DECIMAL(8,2) NOT NULL DEFAULT 0,
  carry_forward_balance DECIMAL(8,2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(8,2) NOT NULL DEFAULT 0,
  source VARCHAR(40) NOT NULL DEFAULT 'PAYROLL',
  calculated_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_leave_balance_employee_month (employee_id, balance_month),
  KEY idx_leave_balance_month (balance_month),
  CONSTRAINT fk_leave_balance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_balance_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  balance_month DATE NOT NULL,
  transaction_type ENUM('MONTHLY_CREDIT', 'PAID_LEAVE_USAGE', 'ADJUSTMENT') NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  reference_type VARCHAR(40) NOT NULL,
  reference_id BIGINT NULL,
  idempotency_key VARCHAR(160) NOT NULL,
  metadata JSON NULL, 
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_leave_balance_transaction (employee_id, idempotency_key),
  KEY idx_leave_transaction_employee_month (employee_id, balance_month),
  CONSTRAINT fk_leave_transaction_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

ALTER TABLE salary
  ADD COLUMN paid_leave_balance DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN paid_leave_used DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN unpaid_leave_days DECIMAL(8,2) NOT NULL DEFAULT 0,
  ADD COLUMN monthly_leave_credit DECIMAL(8,2) NOT NULL DEFAULT 1,
  ADD COLUMN carry_forward_balance DECIMAL(8,2) NOT NULL DEFAULT 0;
