CREATE TABLE IF NOT EXISTS employer_credits (
  id CHAR(36) PRIMARY KEY,
  employer_id CHAR(36) NOT NULL,
  payment_id CHAR(36) NULL,
  package_id VARCHAR(64) NOT NULL,
  package_name VARCHAR(128) NOT NULL,
  duration_days INT NOT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  remaining INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cred_emp FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cred_pay FOREIGN KEY (payment_id) REFERENCES job_payments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
