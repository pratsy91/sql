import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Connection & Authentication - PostgreSQL Learning',
  description: 'Learn about connection strings, authentication methods, roles, and connection pooling',
};

export default function ConnectionAuthentication() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Connection & Authentication</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Connection Strings</h2>
          <p className="mb-4">
            Connection strings are used to specify how to connect to a PostgreSQL database. They 
            contain all necessary information including host, port, database name, username, and password.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Connection String Format</h3>
          <CodeBlock
            title="Basic Connection String Format"
            language="text"
            code={`postgresql://[user[:password]@][host][:port][/database][?parameter_list]`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Connection String Examples</h3>
          <CodeBlock
            title="SQL: Various Connection String Formats"
            language="text"
            code={`# Basic connection (defaults: localhost, port 5432, current user)
postgresql://localhost/mydatabase

# With username
postgresql://username@localhost/mydatabase

# With username and password
postgresql://username:password@localhost/mydatabase

# With port
postgresql://username:password@localhost:5432/mydatabase

# With specific schema
postgresql://username:password@localhost:5432/mydatabase?schema=myschema

# With SSL
postgresql://username:password@localhost:5432/mydatabase?sslmode=require

# Remote connection
postgresql://username:password@example.com:5432/mydatabase

# Connection pool parameters
postgresql://username:password@localhost:5432/mydatabase?pool_timeout=10&connect_timeout=10

# All parameters
postgresql://username:password@localhost:5432/mydatabase?sslmode=require&connect_timeout=10&application_name=myapp`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Using Connection Strings</h3>
          <CodeBlock
            title="SQL: Using Connection Strings with psql"
            language="bash"
            code={`# Connect using connection string
psql "postgresql://username:password@localhost:5432/mydatabase"

# Set connection string as environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase"
psql $DATABASE_URL`}
          />
          <CodeBlock
            title="Prisma: Connection String Configuration"
            language="prisma"
            code={`// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// .env file
DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?schema=public"

// With connection pooling (recommended for serverless)
DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?schema=public&connection_limit=10&pool_timeout=20"

// With SSL
DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?sslmode=require"

// Prisma automatically handles connection pooling`}
          />
          <CodeBlock
            title="JavaScript: Using Connection Strings"
            language="javascript"
            code={`// Using pg library (node-postgres)
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://username:password@localhost:5432/mydatabase',
  // Or use individual parameters:
  // host: 'localhost',
  // port: 5432,
  // database: 'mydatabase',
  // user: 'username',
  // password: 'password',
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect();

// Using connection pool
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://username:password@localhost:5432/mydatabase',
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Authentication Methods</h2>
          <p className="mb-4">
            PostgreSQL supports multiple authentication methods. The method used is determined by 
            the <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">pg_hba.conf</code> file configuration.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">trust</h3>
          <p className="mb-4">
            Allows connection without any password. <strong>Use only for local development!</strong>
          </p>
          <CodeBlock
            title="pg_hba.conf: trust Method"
            language="ini"
            code={`# Allow all local connections without password
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">md5</h3>
          <p className="mb-4">
            Uses MD5-hashed password. This is a legacy method and less secure than scram-sha-256.
          </p>
          <CodeBlock
            title="pg_hba.conf: md5 Method"
            language="ini"
            code={`# MD5 password authentication
host    all             all             127.0.0.1/32            md5

# Set password for user
ALTER USER myuser WITH PASSWORD 'mypassword';`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">scram-sha-256 (Recommended)</h3>
          <p className="mb-4">
            Uses SCRAM-SHA-256 password authentication. This is the recommended method for password-based authentication.
          </p>
          <CodeBlock
            title="pg_hba.conf: scram-sha-256 Method"
            language="ini"
            code={`# SCRAM-SHA-256 password authentication (recommended)
host    all             all             127.0.0.1/32            scram-sha-256

# Set password for user
ALTER USER myuser WITH PASSWORD 'mypassword';

# PostgreSQL automatically uses scram-sha-256 when you set a password`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">password</h3>
          <p className="mb-4">
            Sends password in plain text. <strong>Not recommended!</strong> Only use over SSL connections.
          </p>
          <CodeBlock
            title="pg_hba.conf: password Method"
            language="ini"
            code={`# Plain text password (only over SSL!)
hostssl all             all             0.0.0.0/0               password`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">peer</h3>
          <p className="mb-4">
            Uses the operating system username. Only available on Unix systems.
          </p>
          <CodeBlock
            title="pg_hba.conf: peer Method"
            language="ini"
            code={`# Peer authentication (Unix only)
local   all             all                                     peer

# The PostgreSQL username must match the OS username
# If they differ, use:
local   all             all                                     peer map=mymap

# Create mapping in pg_ident.conf:
# mymap  osuser  pguser`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">ident</h3>
          <p className="mb-4">
            Uses ident protocol. Similar to peer but works over TCP/IP. Only available on Unix systems.
          </p>
          <CodeBlock
            title="pg_hba.conf: ident Method"
            language="ini"
            code={`# Ident authentication
host    all             all             127.0.0.1/32            ident`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">cert</h3>
          <p className="mb-4">
            Uses SSL client certificates for authentication.
          </p>
          <CodeBlock
            title="pg_hba.conf: cert Method"
            language="ini"
            code={`# SSL certificate authentication
hostssl all             all             0.0.0.0/0               cert
hostssl all             all             0.0.0.0/0               cert map=mymap`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">gss</h3>
          <p className="mb-4">
            Uses GSSAPI (Generic Security Services API) for authentication, typically Kerberos.
          </p>
          <CodeBlock
            title="pg_hba.conf: gss Method"
            language="ini"
            code={`# GSSAPI authentication
host    all             all             0.0.0.0/0               gss`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">ldap</h3>
          <p className="mb-4">
            Uses LDAP (Lightweight Directory Access Protocol) for authentication.
          </p>
          <CodeBlock
            title="pg_hba.conf: ldap Method"
            language="ini"
            code={`# LDAP authentication
host    all             all             0.0.0.0/0               ldap ldapserver=ldap.example.com ldapprefix="uid=" ldapsuffix=",ou=people,dc=example,dc=com"`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">pam</h3>
          <p className="mb-4">
            Uses PAM (Pluggable Authentication Modules) for authentication.
          </p>
          <CodeBlock
            title="pg_hba.conf: pam Method"
            language="ini"
            code={`# PAM authentication
host    all             all             127.0.0.1/32            pam pamservice=postgresql`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">reject</h3>
          <p className="mb-4">
            Explicitly rejects connections. Useful for blocking specific hosts or users.
          </p>
          <CodeBlock
            title="pg_hba.conf: reject Method"
            language="ini"
            code={`# Reject connections from specific host
host    all             all             192.168.1.100/32        reject`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Roles and Privileges</h2>
          <p className="mb-4">
            PostgreSQL uses a role-based access control system. Roles can represent both users and 
            groups. Every role can have various privileges on database objects.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Creating and Managing Roles</h3>
          <CodeBlock
            title="SQL: Role Management"
            language="sql"
            code={`-- Create a role (can be used as user or group)
CREATE ROLE myrole;

-- Create a role that can login (user)
CREATE ROLE myuser WITH LOGIN;

-- Create role with password
CREATE ROLE myuser WITH LOGIN PASSWORD 'mypassword';

-- Create role with multiple attributes
CREATE ROLE adminuser WITH
  LOGIN
  PASSWORD 'adminpass'
  CREATEDB
  CREATEROLE
  SUPERUSER;

-- List all roles
\\du

-- Or using SQL
SELECT rolname, rolcanlogin, rolsuper 
FROM pg_roles;

-- Alter role
ALTER ROLE myuser WITH PASSWORD 'newpassword';
ALTER ROLE myuser CREATEDB;
ALTER ROLE myuser NOCREATEDB;

-- Rename role
ALTER ROLE myuser RENAME TO newusername;

-- Drop role
DROP ROLE myuser;

-- Grant privileges to role
GRANT SELECT, INSERT, UPDATE ON TABLE users TO myuser;
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
GRANT USAGE ON SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;

-- Revoke privileges
REVOKE INSERT ON TABLE users FROM myuser;

-- Grant role to another role (role membership)
GRANT adminuser TO myuser;

-- Remove role membership
REVOKE adminuser FROM myuser;`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Role Attributes</h3>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>LOGIN:</strong> Role can log in (makes it a user)</li>
              <li><strong>SUPERUSER:</strong> Bypasses all access controls</li>
              <li><strong>CREATEDB:</strong> Can create databases</li>
              <li><strong>CREATEROLE:</strong> Can create roles</li>
              <li><strong>INHERIT:</strong> Inherits privileges from roles it's a member of (default)</li>
              <li><strong>REPLICATION:</strong> Can initiate streaming replication</li>
              <li><strong>BYPASSRLS:</strong> Bypasses Row Level Security policies</li>
            </ul>
          </div>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Object Privileges</h3>
          <CodeBlock
            title="SQL: Granting Object Privileges"
            language="sql"
            code={`-- Table privileges
GRANT SELECT ON TABLE users TO myuser;
GRANT INSERT ON TABLE users TO myuser;
GRANT UPDATE ON TABLE users TO myuser;
GRANT DELETE ON TABLE users TO myuser;
GRANT TRUNCATE ON TABLE users TO myuser;
GRANT REFERENCES ON TABLE users TO myuser;
GRANT TRIGGER ON TABLE users TO myuser;
GRANT ALL PRIVILEGES ON TABLE users TO myuser;

-- Column-level privileges
GRANT SELECT (id, name) ON TABLE users TO myuser;
GRANT UPDATE (name) ON TABLE users TO myuser;

-- Sequence privileges
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO myuser;

-- Database privileges
GRANT CREATE ON DATABASE mydatabase TO myuser;
GRANT CONNECT ON DATABASE mydatabase TO myuser;
GRANT TEMPORARY ON DATABASE mydatabase TO myuser;

-- Schema privileges
GRANT USAGE ON SCHEMA public TO myuser;
GRANT CREATE ON SCHEMA public TO myuser;

-- Function privileges
GRANT EXECUTE ON FUNCTION myfunction() TO myuser;

-- View privileges
GRANT SELECT ON VIEW myview TO myuser;

-- Grant on all objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO myuser;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO myuser;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO myuser;`}
          />
          
          <CodeBlock
            title="Prisma: Role Management"
            language="javascript"
            code={`// Prisma doesn't manage roles directly, but you can use raw SQL
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create a role using raw SQL
await prisma.$executeRaw\`
  CREATE ROLE myuser WITH LOGIN PASSWORD 'mypassword'
\`

// Grant privileges
await prisma.$executeRaw\`
  GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser
\`

await prisma.$executeRaw\`
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser
\`

// Note: Prisma migrations run with the connection user's privileges
// Make sure your connection user has necessary privileges to create tables, etc.`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Connection Pooling</h2>
          <p className="mb-4">
            Connection pooling allows multiple clients to share a pool of database connections, 
            reducing overhead and improving performance. This is especially important for web 
            applications with many concurrent requests.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Why Connection Pooling?</h3>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Creating database connections is expensive</li>
              <li>PostgreSQL has a limit on concurrent connections (default: 100)</li>
              <li>Connection pooling reuses connections efficiently</li>
              <li>Reduces connection overhead and improves response times</li>
            </ul>
          </div>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">pgBouncer</h3>
          <p className="mb-4">
            pgBouncer is a popular connection pooler for PostgreSQL. It sits between your 
            application and PostgreSQL, managing connection pools.
          </p>
          <CodeBlock
            title="pgBouncer Configuration"
            language="ini"
            code={`# pgbouncer.ini
[databases]
mydatabase = host=localhost port=5432 dbname=mydatabase

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 0
max_user_connections = 0`}
          />
          <CodeBlock
            title="Using pgBouncer"
            language="text"
            code={`# Connect through pgBouncer (port 6432 instead of 5432)
postgresql://username:password@localhost:6432/mydatabase

# Application connects to pgBouncer, which manages connections to PostgreSQL`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Application-Level Pooling</h3>
          <CodeBlock
            title="Node.js: Using pg Pool"
            language="javascript"
            code={`const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydatabase',
  user: 'myuser',
  password: 'mypassword',
  max: 20,                    // Maximum pool size
  min: 5,                     // Minimum pool size
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
});

// Use the pool
const result = await pool.query('SELECT * FROM users');

// Pool automatically manages connections
// No need to manually connect/disconnect`}
          />
          
          <CodeBlock
            title="Prisma: Connection Pooling"
            language="prisma"
            code={`// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// .env - Prisma automatically uses connection pooling
DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?connection_limit=10&pool_timeout=20"

// Prisma Client automatically manages connection pooling
// Each PrismaClient instance maintains its own connection pool
import { PrismaClient } from '@prisma/client'

// In production, use a singleton pattern to reuse the same PrismaClient instance
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// For serverless environments, use connection pooling service or pgBouncer
// Example with connection limit:
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=1&pool_timeout=20'
    }
  }
})`}
          />
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Connection Pooling Best Practices</h3>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Pool Size:</strong> Set based on your application's concurrency needs (typically 10-20 connections)</li>
              <li><strong>Serverless:</strong> Use connection pooling service (like Supabase, Neon) or pgBouncer</li>
              <li><strong>Singleton Pattern:</strong> Reuse the same PrismaClient instance across your application</li>
              <li><strong>Connection Limits:</strong> Don't exceed PostgreSQL's max_connections setting</li>
              <li><strong>Monitoring:</strong> Monitor connection pool usage and adjust as needed</li>
            </ul>
          </div>
          
          <CodeBlock
            title="Prisma: Singleton Pattern for Connection Pooling"
            language="javascript"
            code={`// lib/prisma.js - Singleton pattern
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

// Usage in your application
import prisma from './lib/prisma'

// All imports use the same PrismaClient instance
// This ensures efficient connection pooling`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

