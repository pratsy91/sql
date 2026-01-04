import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Encryption - PostgreSQL Learning',
  description: 'Learn about PostgreSQL encryption including SSL connections and encrypted columns',
};

export default function Encryption() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Encryption</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">SSL Connections</h2>

          <CodeBlock
            title="SQL: SSL/TLS Configuration"
            language="sql"
            code={`-- Check SSL status
SHOW ssl;
SHOW ssl_cert_file;
SHOW ssl_key_file;
SHOW ssl_ca_file;

-- View SSL connection info
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  ssl,
  sslversion,
  sslcipher,
  ssl_client_dn
FROM pg_stat_ssl
JOIN pg_stat_activity USING (pid)
WHERE ssl = true;

-- Force SSL connections (in pg_hba.conf)
-- hostssl all all 0.0.0.0/0 md5
-- Only allows SSL connections

-- Connection string with SSL
-- postgresql://user:password@host:5432/db?sslmode=require

-- SSL modes:
-- disable: No SSL
-- allow: Try non-SSL first, then SSL
-- prefer: Try SSL first, then non-SSL (default)
-- require: Require SSL
-- verify-ca: Require SSL and verify CA
-- verify-full: Require SSL, verify CA and hostname

-- Check current SSL mode
SHOW ssl_mode;

-- View SSL settings
SELECT name, setting, unit
FROM pg_settings
WHERE name LIKE 'ssl%'
ORDER BY name;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Encrypted Columns</h2>

          <CodeBlock
            title="SQL: Column Encryption"
            language="sql"
            code={`-- PostgreSQL doesn't have built-in column encryption
-- Use pgcrypto extension for encryption functions

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt data on insert
INSERT INTO users (name, email, password_hash)
VALUES (
  'John Doe',
  'john@example.com',
  crypt('my_password', gen_salt('bf'))
);
-- bcrypt encryption for passwords

-- Verify encrypted password
SELECT * FROM users
WHERE email = 'john@example.com'
  AND password_hash = crypt('my_password', password_hash);
-- Returns row if password matches

-- Encrypt with AES
INSERT INTO sensitive_data (id, encrypted_field)
VALUES (
  1,
  pgp_sym_encrypt('sensitive_value', 'encryption_key')
);

-- Decrypt data
SELECT 
  id,
  pgp_sym_decrypt(encrypted_field, 'encryption_key') AS decrypted_value
FROM sensitive_data
WHERE id = 1;

-- Encrypt with public key (asymmetric)
-- First generate key pair (outside PostgreSQL)
-- Then use pgp_pub_encrypt and pgp_pub_decrypt

-- Hash functions (one-way, cannot decrypt)
INSERT INTO users (name, email, password_hash)
VALUES (
  'Jane Doe',
  'jane@example.com',
  encode(digest('my_password', 'sha256'), 'hex')
);
-- SHA-256 hash

-- Verify hash
SELECT * FROM users
WHERE email = 'jane@example.com'
  AND password_hash = encode(digest('my_password', 'sha256'), 'hex');

-- HMAC (Hash-based Message Authentication Code)
SELECT encode(hmac('message', 'secret_key', 'sha256'), 'hex') AS hmac_value;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Encryption Functions</h2>

          <CodeBlock
            title="SQL: pgcrypto Functions"
            language="sql"
            code={`-- Password hashing (bcrypt)
SELECT crypt('password', gen_salt('bf', 10)) AS hashed_password;
-- 'bf' = blowfish (bcrypt), 10 = cost factor

-- Verify password
SELECT crypt('password', '$2a$10$...') = '$2a$10$...' AS password_match;

-- Symmetric encryption (AES)
SELECT pgp_sym_encrypt('plaintext', 'key') AS encrypted;
SELECT pgp_sym_decrypt(encrypted_value, 'key') AS decrypted;

-- Asymmetric encryption (RSA)
SELECT pgp_pub_encrypt('plaintext', public_key) AS encrypted;
SELECT pgp_pub_decrypt(encrypted_value, private_key) AS decrypted;

-- Hash functions
SELECT encode(digest('text', 'md5'), 'hex') AS md5_hash;
SELECT encode(digest('text', 'sha1'), 'hex') AS sha1_hash;
SELECT encode(digest('text', 'sha256'), 'hex') AS sha256_hash;
SELECT encode(digest('text', 'sha512'), 'hex') AS sha512_hash;

-- HMAC
SELECT encode(hmac('message', 'key', 'sha256'), 'hex') AS hmac;

-- Random data
SELECT gen_random_bytes(32) AS random_bytes;
SELECT encode(gen_random_bytes(16), 'hex') AS random_hex;

-- Salt generation
SELECT gen_salt('bf') AS bcrypt_salt;
SELECT gen_salt('md5') AS md5_salt;
SELECT gen_salt('des') AS des_salt;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Encryption Best Practices</h2>

          <CodeBlock
            title="SQL: Encryption Patterns"
            language="sql"
            code={`-- Pattern 1: Password storage
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL
);

-- Hash password on insert
INSERT INTO users (email, password_hash)
VALUES (
  'user@example.com',
  crypt('user_password', gen_salt('bf', 12))
);

-- Verify on login
SELECT id, email
FROM users
WHERE email = 'user@example.com'
  AND password_hash = crypt('user_password', password_hash);

-- Pattern 2: Encrypted sensitive data
CREATE TABLE sensitive_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  encrypted_ssn BYTEA,
  encryption_key_id INTEGER
);

-- Encrypt on insert
INSERT INTO sensitive_data (user_id, encrypted_ssn, encryption_key_id)
VALUES (
  1,
  pgp_sym_encrypt('123-45-6789', 'encryption_key_123'),
  123
);

-- Decrypt on select (with proper access control)
SELECT 
  id,
  user_id,
  pgp_sym_decrypt(encrypted_ssn, 'encryption_key_123') AS ssn
FROM sensitive_data
WHERE user_id = current_user_id();

-- Pattern 3: Application-level encryption
-- Encrypt in application before storing
-- Store encrypted BYTEA in PostgreSQL
-- Decrypt in application after retrieving

-- Pattern 4: Transparent Data Encryption (TDE)
-- Use filesystem-level encryption
-- PostgreSQL data files encrypted at OS level
-- No application changes needed`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Encryption</h2>

          <CodeBlock
            title="Prisma: Encryption Implementation"
            language="prisma"
            code={`// Enable pgcrypto extension
await prisma.$executeRaw\`CREATE EXTENSION IF NOT EXISTS pgcrypto\`;

// Hash password on insert
const hashedPassword = await prisma.$queryRaw\`
  SELECT crypt($1, gen_salt('bf', 12)) AS hash
\`, 'user_password';

await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword[0].hash
  }
});

// Verify password
const user = await prisma.$queryRaw\`
  SELECT id, email
  FROM "User"
  WHERE email = $1
    AND password_hash = crypt($2, password_hash)
\`, 'user@example.com', 'user_password';

// Encrypt sensitive data
const encrypted = await prisma.$queryRaw\`
  SELECT pgp_sym_encrypt($1, $2) AS encrypted
\`, 'sensitive_value', 'encryption_key';

await prisma.sensitiveData.create({
  data: {
    userId: 1,
    encryptedField: encrypted[0].encrypted
  }
});

// Decrypt data
const decrypted = await prisma.$queryRaw\`
  SELECT 
    id,
    pgp_sym_decrypt(encrypted_field, $1) AS decrypted_value
  FROM "SensitiveData"
  WHERE user_id = $2
\`, 'encryption_key', 1;

// SSL connection in Prisma
// Set in DATABASE_URL
// postgresql://user:password@host:5432/db?sslmode=require

// Or in Prisma schema
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
//   // SSL is configured via connection string
// }

// Check SSL status
const sslStatus = await prisma.$queryRaw\`
  SELECT 
    pid,
    ssl,
    sslversion,
    sslcipher
  FROM pg_stat_ssl
  JOIN pg_stat_activity USING (pid)
  WHERE pid = pg_backend_pid()
\`;

// Note: For production, use:
// - SSL/TLS for connections
// - Encrypted columns for sensitive data
// - Strong encryption keys
// - Key management system`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use SSL/TLS</strong> for all network connections</li>
              <li><strong>Require SSL</strong> in production (sslmode=require)</li>
              <li><strong>Use strong encryption</strong> - bcrypt for passwords, AES for data</li>
              <li><strong>Store keys securely</strong> - never in code or database</li>
              <li><strong>Use key management</strong> - AWS KMS, HashiCorp Vault, etc.</li>
              <li><strong>Hash passwords</strong> - never store plaintext passwords</li>
              <li><strong>Use appropriate cost factors</strong> - balance security and performance</li>
              <li><strong>Encrypt at rest</strong> - use filesystem encryption for data files</li>
              <li><strong>Rotate keys regularly</strong> - implement key rotation strategy</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

