-- İzmir İş İlanları 35 — MySQL şeması (Railway MySQL)
-- Railway MySQL → Query / mysql client ile bir kez çalıştır.

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('candidate','employer','admin') NOT NULL DEFAULT 'candidate',
  full_name VARCHAR(255) NULL,
  company_name VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  city VARCHAR(128) NULL,
  avatar_url TEXT NULL,
  bio TEXT NULL,
  cv_url TEXT NULL,
  vergi_numarasi VARCHAR(64) NULL,
  dogrulama_durumu ENUM('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
  dogrulama_talebi_tarihi DATETIME NULL,
  dogrulanma_tarihi DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL UNIQUE,
  icon VARCHAR(64) NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY,
  employer_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  category_id INT NULL,
  sector VARCHAR(128) NULL,
  description TEXT NULL,
  company_name VARCHAR(255) NULL,
  city VARCHAR(128) NULL,
  job_type VARCHAR(64) NULL,
  experience_level VARCHAR(64) NULL,
  salary_min INT NULL,
  salary_max INT NULL,
  requirements JSON NULL,
  benefits JSON NULL,
  image_url TEXT NULL,
  status ENUM('pending','active','rejected','closed','expired') NOT NULL DEFAULT 'pending',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobs_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_category FOREIGN KEY (category_id) REFERENCES job_categories(id) ON DELETE SET NULL,
  INDEX idx_jobs_status (status),
  INDEX idx_jobs_employer (employer_id),
  INDEX idx_jobs_featured (featured),
  INDEX idx_jobs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  cover_letter TEXT NULL,
  cv_url TEXT NULL,
  status ENUM('pending','reviewed','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_app (job_id, candidate_id),
  CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_cand FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favorites (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  job_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fav (user_id, job_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS job_payments (
  id CHAR(36) PRIMARY KEY,
  employer_id CHAR(36) NOT NULL,
  package_id VARCHAR(64) NOT NULL,
  package_name VARCHAR(128) NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
  status VARCHAR(64) NOT NULL DEFAULT 'pending',
  iyzico_payment_id VARCHAR(128) NULL,
  iyzico_token VARCHAR(255) NULL,
  credits_meta JSON NULL,
  buyer_name VARCHAR(255) NULL,
  buyer_email VARCHAR(255) NULL,
  buyer_phone VARCHAR(64) NULL,
  company_name VARCHAR(255) NULL,
  tax_id VARCHAR(64) NULL,
  billing_address TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_emp FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_pay_token (iyzico_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  link VARCHAR(512) NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO job_categories (name, icon, sort_order) VALUES
  ('Teknoloji', 'ri-code-s-slash-line', 1),
  ('Satış & Pazarlama', 'ri-megaphone-line', 2),
  ('Muhasebe & Finans', 'ri-money-dollar-circle-line', 3),
  ('İnsan Kaynakları', 'ri-team-line', 4),
  ('Üretim', 'ri-building-2-line', 5),
  ('Lojistik', 'ri-truck-line', 6),
  ('Sağlık', 'ri-heart-pulse-line', 7),
  ('Eğitim', 'ri-book-open-line', 8),
  ('Turizm & Otelcilik', 'ri-hotel-line', 9),
  ('Diğer', 'ri-briefcase-line', 99);
