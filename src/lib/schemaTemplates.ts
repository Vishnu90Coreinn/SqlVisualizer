export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tables: number;
  sql: string;
}

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Products, orders, customers, payments, reviews',
    emoji: '🛒',
    tables: 8,
    sql: `CREATE TABLE customers (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  line1 VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_id INT,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  category_id INT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  address_id INT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  paid_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE reviews (
  id INT PRIMARY KEY,
  product_id INT NOT NULL,
  customer_id INT NOT NULL,
  rating INT NOT NULL,
  body TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);`,
  },

  {
    id: 'blog',
    name: 'Blog / CMS',
    description: 'Posts, authors, categories, tags, comments',
    emoji: '✍️',
    tables: 7,
    sql: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id INT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  author_id INT NOT NULL,
  category_id INT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE tags (
  id INT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE comments (
  id INT PRIMARY KEY,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  parent_id INT,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES comments(id)
);

CREATE TABLE post_views (
  id INT PRIMARY KEY,
  post_id INT NOT NULL,
  viewer_ip VARCHAR(50),
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);`,
  },

  {
    id: 'slack',
    name: 'Slack Clone',
    description: 'Workspaces, channels, messages, reactions',
    emoji: '💬',
    tables: 7,
    sql: `CREATE TABLE workspaces (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_members (
  workspace_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE channels (
  id INT PRIMARY KEY,
  workspace_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  topic VARCHAR(255),
  created_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE channel_members (
  channel_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (channel_id, user_id),
  FOREIGN KEY (channel_id) REFERENCES channels(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE messages (
  id INT PRIMARY KEY,
  channel_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT,
  body TEXT NOT NULL,
  edited_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (channel_id) REFERENCES channels(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES messages(id)
);

CREATE TABLE reactions (
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  emoji VARCHAR(50) NOT NULL,
  PRIMARY KEY (message_id, user_id, emoji),
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);`,
  },

  {
    id: 'github',
    name: 'GitHub Clone',
    description: 'Repos, issues, pull requests, commits, stars',
    emoji: '🐙',
    tables: 8,
    sql: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE repositories (
  id INT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  default_branch VARCHAR(100) DEFAULT 'main',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE stars (
  user_id INT NOT NULL,
  repo_id INT NOT NULL,
  starred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, repo_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (repo_id) REFERENCES repositories(id)
);

CREATE TABLE issues (
  id INT PRIMARY KEY,
  repo_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (repo_id) REFERENCES repositories(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE pull_requests (
  id INT PRIMARY KEY,
  repo_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  head_branch VARCHAR(100) NOT NULL,
  base_branch VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  merged_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (repo_id) REFERENCES repositories(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE commits (
  id INT PRIMARY KEY,
  repo_id INT NOT NULL,
  author_id INT NOT NULL,
  sha VARCHAR(40) NOT NULL UNIQUE,
  message TEXT NOT NULL,
  committed_at TIMESTAMP NOT NULL,
  FOREIGN KEY (repo_id) REFERENCES repositories(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE issue_comments (
  id INT PRIMARY KEY,
  issue_id INT NOT NULL,
  author_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (issue_id) REFERENCES issues(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);`,
  },

  {
    id: 'twitter',
    name: 'Twitter / X Clone',
    description: 'Tweets, follows, likes, retweets, hashtags',
    emoji: '🐦',
    tables: 7,
    sql: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  bio VARCHAR(160),
  avatar_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tweets (
  id INT PRIMARY KEY,
  author_id INT NOT NULL,
  body VARCHAR(280) NOT NULL,
  reply_to_id INT,
  retweet_of_id INT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (reply_to_id) REFERENCES tweets(id),
  FOREIGN KEY (retweet_of_id) REFERENCES tweets(id)
);

CREATE TABLE follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  followed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);

CREATE TABLE likes (
  user_id INT NOT NULL,
  tweet_id INT NOT NULL,
  liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tweet_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);

CREATE TABLE hashtags (
  id INT PRIMARY KEY,
  tag VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tweet_hashtags (
  tweet_id INT NOT NULL,
  hashtag_id INT NOT NULL,
  PRIMARY KEY (tweet_id, hashtag_id),
  FOREIGN KEY (tweet_id) REFERENCES tweets(id),
  FOREIGN KEY (hashtag_id) REFERENCES hashtags(id)
);

CREATE TABLE bookmarks (
  user_id INT NOT NULL,
  tweet_id INT NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tweet_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);`,
  },

  {
    id: 'banking',
    name: 'Banking System',
    description: 'Accounts, transactions, cards, loans, branches',
    emoji: '🏦',
    tables: 6,
    sql: `CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  national_id VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE branches (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  swift_code VARCHAR(20)
);

CREATE TABLE accounts (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  branch_id INT NOT NULL,
  account_number VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE transactions (
  id INT PRIMARY KEY,
  from_account_id INT,
  to_account_id INT,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(30) NOT NULL,
  description VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id)
);

CREATE TABLE cards (
  id INT PRIMARY KEY,
  account_id INT NOT NULL,
  card_number_last4 CHAR(4) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expires_at DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  daily_limit DECIMAL(10,2),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE loans (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  branch_id INT NOT NULL,
  principal DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  term_months INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  disbursed_at DATE,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);`,
  },

  {
    id: 'hospital',
    name: 'Hospital / Clinic',
    description: 'Patients, doctors, appointments, prescriptions',
    emoji: '🏥',
    tables: 7,
    sql: `CREATE TABLE patients (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  date_of_birth DATE NOT NULL,
  blood_type VARCHAR(5),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  floor INT
);

CREATE TABLE doctors (
  id INT PRIMARY KEY,
  department_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  specialization VARCHAR(100),
  license_number VARCHAR(50) UNIQUE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE appointments (
  id INT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 30,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE medical_records (
  id INT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  diagnosis TEXT,
  notes TEXT,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE medications (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  requires_prescription BOOLEAN DEFAULT TRUE
);

CREATE TABLE prescriptions (
  id INT PRIMARY KEY,
  record_id INT NOT NULL,
  medication_id INT NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration_days INT,
  FOREIGN KEY (record_id) REFERENCES medical_records(id),
  FOREIGN KEY (medication_id) REFERENCES medications(id)
);`,
  },

  {
    id: 'saas',
    name: 'SaaS Multi-Tenant',
    description: 'Organizations, users, plans, subscriptions, features',
    emoji: '☁️',
    tables: 7,
    sql: `CREATE TABLE plans (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  max_seats INT,
  max_storage_gb INT
);

CREATE TABLE organizations (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  plan_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE subscriptions (
  id INT PRIMARY KEY,
  org_id INT NOT NULL,
  plan_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(10) NOT NULL DEFAULT 'monthly',
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE users (
  id INT PRIMARY KEY,
  org_id INT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

CREATE TABLE features (
  id INT PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE plan_features (
  plan_id INT NOT NULL,
  feature_id INT NOT NULL,
  limit_value INT,
  PRIMARY KEY (plan_id, feature_id),
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (feature_id) REFERENCES features(id)
);

CREATE TABLE audit_logs (
  id INT PRIMARY KEY,
  org_id INT NOT NULL,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);`,
  },
];
