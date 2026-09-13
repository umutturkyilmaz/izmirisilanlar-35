CREATE TABLE IF NOT EXISTS ads (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  placement VARCHAR(32) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ads_placement_active (placement, is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
