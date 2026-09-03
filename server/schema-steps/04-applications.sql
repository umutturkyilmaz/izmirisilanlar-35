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
