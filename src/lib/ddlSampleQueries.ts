import type { SampleQuery } from './sampleQueries';

export const DDL_SAMPLE_QUERIES: SampleQuery[] = [
  {
    label: 'Users & Posts',
    description: 'Simple two-table schema with a FK relationship',
    sql: `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  published_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`,
  },
  {
    label: 'E-commerce',
    description: 'Customers, orders, items, and products with FKs',
    sql: `CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  region VARCHAR(100)
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);`,
  },
  {
    label: 'Many-to-Many',
    description: 'Junction table pattern: students, courses, enrollments',
    sql: `CREATE TABLE students (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  enrolled_at DATE NOT NULL
);

CREATE TABLE courses (
  id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  credits INT NOT NULL,
  instructor VARCHAR(255)
);

CREATE TABLE enrollments (
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  grade CHAR(2),
  enrolled_at TIMESTAMP NOT NULL,
  PRIMARY KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);`,
  },
  {
    label: 'Indexes & Constraints',
    description: 'Schema with unique constraints, indexes, and ALTER TABLE FKs',
    sql: `CREATE TABLE departments (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  budget DECIMAL(15,2)
);

CREATE TABLE employees (
  id INT PRIMARY KEY,
  department_id INT,
  manager_id INT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  salary DECIMAL(10,2) NOT NULL,
  hired_at DATE NOT NULL
);

CREATE UNIQUE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_dept ON employees(department_id);

ALTER TABLE employees
  ADD CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE employees
  ADD CONSTRAINT fk_emp_mgr FOREIGN KEY (manager_id) REFERENCES employees(id);`,
  },
];
