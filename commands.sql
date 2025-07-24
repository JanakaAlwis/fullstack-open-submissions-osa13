CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  author TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  likes INTEGER DEFAULT 0
);

INSERT INTO blogs (author, url, title) VALUES
('Dan Abramov', 'https://overreacted.io/', 'On let vs const'),
('Laurenz Albe', 'https://www.cybertec-postgresql.com/', 'Gaps in sequences in PostgreSQL');
