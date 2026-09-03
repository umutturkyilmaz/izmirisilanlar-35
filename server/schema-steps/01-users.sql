-- Sadece 1. tablo: users
-- Railway Query'ye SADECE asagidaki satirlari yapistir, Run:

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
  updated_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
