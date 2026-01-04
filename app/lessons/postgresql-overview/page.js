import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'PostgreSQL Overview - PostgreSQL Learning',
  description: 'Learn about PostgreSQL history, versions, and features',
};

export default function PostgreSQLOverview() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">PostgreSQL Overview</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">History</h2>
          <p className="mb-4">
            PostgreSQL, often simply called Postgres, is a powerful, open-source object-relational 
            database system. It has a rich history dating back to 1986 when it was developed at 
            the University of California, Berkeley as a follow-up to the Ingres database project.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>1986-1994:</strong> POSTGRES project at UC Berkeley</li>
            <li><strong>1995:</strong> Postgres95 - first open-source release</li>
            <li><strong>1996:</strong> Renamed to PostgreSQL</li>
            <li><strong>2000s:</strong> Rapid development and feature additions</li>
            <li><strong>Present:</strong> One of the most advanced open-source databases</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Versions</h2>
          <p className="mb-4">
            PostgreSQL follows a versioning scheme where major versions are released approximately 
            once per year. Each version brings new features, performance improvements, and bug fixes.
          </p>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Current Major Versions:</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>PostgreSQL 16 (Latest stable)</li>
              <li>PostgreSQL 15</li>
              <li>PostgreSQL 14</li>
              <li>PostgreSQL 13</li>
            </ul>
          </div>
          <p className="mb-4">
            Each version is supported for 5 years with security updates. It's recommended to stay 
            on a supported version for production environments.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">ACID Compliance</h3>
              <p className="text-sm">Full ACID (Atomicity, Consistency, Isolation, Durability) support for reliable transactions.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Extensibility</h3>
              <p className="text-sm">Support for custom data types, functions, operators, and procedural languages.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">JSON Support</h3>
              <p className="text-sm">Native JSON and JSONB data types with powerful querying capabilities.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Full-Text Search</h3>
              <p className="text-sm">Built-in full-text search with ranking and highlighting support.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Advanced Indexing</h3>
              <p className="text-sm">B-tree, Hash, GiST, GIN, BRIN, and SP-GiST index types.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Replication</h3>
              <p className="text-sm">Streaming replication, logical replication, and high availability options.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Partitioning</h3>
              <p className="text-sm">Table partitioning for improved performance with large datasets.</p>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Window Functions</h3>
              <p className="text-sm">Advanced analytical functions for complex data analysis.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Installation</h2>
          
          <h3 className="text-xl font-semibold mb-3">Windows</h3>
          <p className="mb-4">Download the installer from the official PostgreSQL website:</p>
          <CodeBlock
            title="Windows Installation Steps"
            language="bash"
            code={`# 1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
# 2. Run the installer
# 3. Choose installation directory (default: C:\\Program Files\\PostgreSQL\\16)
# 4. Select components: PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools
# 5. Set data directory (default: C:\\Program Files\\PostgreSQL\\16\\data)
# 6. Set superuser password (remember this!)
# 7. Set port (default: 5432)
# 8. Choose locale (default: [Default locale])
# 9. Complete installation`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">macOS</h3>
          <p className="mb-4">Using Homebrew (recommended):</p>
          <CodeBlock
            title="macOS Installation via Homebrew"
            language="bash"
            code={`# Install Homebrew if not already installed
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Verify installation
psql --version`}
          />
          <p className="mb-4 mt-4">Or download from EnterpriseDB:</p>
          <CodeBlock
            title="macOS Installation via Installer"
            language="bash"
            code={`# Download PostgreSQL.app from https://postgresapp.com/
# Or download from EnterpriseDB: https://www.postgresql.org/download/macosx/`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">Linux (Ubuntu/Debian)</h3>
          <CodeBlock
            title="Linux Installation"
            language="bash"
            code={`# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Check version
psql --version

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Check service status
sudo systemctl status postgresql`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">Linux (CentOS/RHEL/Fedora)</h3>
          <CodeBlock
            title="RHEL/CentOS/Fedora Installation"
            language="bash"
            code={`# Install PostgreSQL repository (for RHEL/CentOS)
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL
sudo yum install -y postgresql16-server postgresql16

# Initialize database
sudo /usr/pgsql-16/bin/postgresql-16-setup initdb

# Start PostgreSQL
sudo systemctl start postgresql-16
sudo systemctl enable postgresql-16`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Configuration Files</h2>
          
          <h3 className="text-xl font-semibold mb-3">postgresql.conf</h3>
          <p className="mb-4">
            Main configuration file that controls PostgreSQL server behavior. Located in the data directory.
          </p>
          <CodeBlock
            title="Key Configuration Parameters"
            language="ini"
            code={`# Connection Settings
listen_addresses = 'localhost'          # IP addresses to listen on
port = 5432                             # Port number
max_connections = 100                    # Maximum concurrent connections

# Memory Settings
shared_buffers = 128MB                   # Shared memory buffer
effective_cache_size = 4GB              # Estimated cache size
work_mem = 4MB                           # Memory for sorting operations
maintenance_work_mem = 64MB              # Memory for maintenance operations

# WAL (Write-Ahead Logging) Settings
wal_level = replica                      # WAL level (minimal, replica, logical)
max_wal_size = 1GB                       # Maximum WAL size
min_wal_size = 80MB                      # Minimum WAL size

# Query Planner
random_page_cost = 4.0                   # Cost of random page access
effective_io_concurrency = 1             # Concurrent I/O operations

# Logging
logging_collector = on                   # Enable logging collector
log_directory = 'log'                    # Log directory
log_filename = 'postgresql-%Y-%m-%d.log' # Log file name pattern
log_statement = 'all'                    # Log all statements (modify for production)`}
          />
          <p className="mb-4 mt-4">
            <strong>Location:</strong> Usually in <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">/var/lib/postgresql/data/postgresql.conf</code> (Linux) 
            or <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">C:\Program Files\PostgreSQL\16\data\postgresql.conf</code> (Windows)
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">pg_hba.conf</h3>
          <p className="mb-4">
            Host-Based Authentication file that controls client authentication. Each line specifies 
            a connection type, database, user, address, and authentication method.
          </p>
          <CodeBlock
            title="pg_hba.conf Examples"
            language="ini"
            code={`# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     trust

# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256

# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256

# Allow replication connections from localhost
host    replication     all             127.0.0.1/32            scram-sha-256

# Allow connections from specific network
host    all             all             192.168.1.0/24          md5

# Allow specific user from specific IP
host    mydb            myuser          192.168.1.100/32        scram-sha-256`}
          />
          <p className="mb-4 mt-4">
            <strong>Authentication Methods:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>trust:</strong> No password required (use only for local development)</li>
            <li><strong>md5:</strong> MD5-hashed password (legacy, less secure)</li>
            <li><strong>scram-sha-256:</strong> SCRAM-SHA-256 password authentication (recommended)</li>
            <li><strong>password:</strong> Plain text password (not recommended)</li>
            <li><strong>peer:</strong> Uses OS username (Unix only)</li>
            <li><strong>ident:</strong> Uses ident protocol (Unix only)</li>
          </ul>
          <p className="mb-4">
            <strong>Location:</strong> Same directory as postgresql.conf
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">psql Basics</h2>
          <p className="mb-4">
            psql is the command-line interface for PostgreSQL. It's a powerful tool for interacting 
            with your database.
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Connecting to PostgreSQL</h3>
          <CodeBlock
            title="Basic Connection"
            language="bash"
            code={`# Connect to default database (postgres) as current user
psql

# Connect to specific database
psql -d mydatabase

# Connect as specific user
psql -U username

# Connect to specific database as specific user
psql -U username -d mydatabase

# Connect to remote server
psql -h hostname -p 5432 -U username -d mydatabase

# Connect with connection string
psql "postgresql://username:password@localhost:5432/mydatabase"`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">Common psql Commands</h3>
          <CodeBlock
            title="psql Meta-Commands"
            language="sql"
            code={`-- List all databases
\\l

-- Connect to a database
\\c database_name

-- List all tables
\\dt

-- List all tables in a schema
\\dt schema_name.*

-- Describe a table structure
\\d table_name

-- List all schemas
\\dn

-- List all users/roles
\\du

-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;

-- Show version
SELECT version();

-- Execute SQL from file
\\i /path/to/file.sql

-- Export query results to file
\\o /path/to/output.txt
SELECT * FROM users;
\\o

-- Show command history
\\s

-- Quit psql
\\q`}
          />

          <h3 className="text-xl font-semibold mb-3 mt-6">psql Configuration</h3>
          <p className="mb-4">
            Create a <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">.psqlrc</code> file in your home directory 
            to customize psql behavior:
          </p>
          <CodeBlock
            title=".psqlrc Configuration"
            language="sql"
            code={`-- Enable timing for queries
\\timing

-- Set prompt to show database and user
\\set PROMPT1 '%[%033[1;33;40m%]%n@%M:%>%[%033[0m%] %# '

-- Enable expanded display for wide tables
\\x auto

-- Set null display
\\pset null '(null)'

-- Enable auto-commit
\\set AUTOCOMMIT on`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">GUI Tools</h2>
          
          <h3 className="text-xl font-semibold mb-3">pgAdmin</h3>
          <p className="mb-4">
            pgAdmin is the most popular open-source administration and development platform for PostgreSQL.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Features:</strong> Visual query builder, server management, backup/restore, user management</li>
            <li><strong>Installation:</strong> Usually included with PostgreSQL installation, or download from pgadmin.org</li>
            <li><strong>Platform:</strong> Windows, macOS, Linux</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">DBeaver</h3>
          <p className="mb-4">
            Universal database tool that supports PostgreSQL and many other databases.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Features:</strong> ER diagrams, data export/import, SQL editor, database comparison</li>
            <li><strong>Installation:</strong> Download from dbeaver.io</li>
            <li><strong>Platform:</strong> Windows, macOS, Linux</li>
            <li><strong>License:</strong> Free community edition and paid enterprise edition</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Other Popular Tools</h3>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>DataGrip:</strong> JetBrains database IDE (paid)</li>
              <li><strong>TablePlus:</strong> Modern database management tool (freemium)</li>
              <li><strong>Postico:</strong> PostgreSQL client for macOS (paid)</li>
              <li><strong>Azure Data Studio:</strong> Cross-platform database tool (free)</li>
              <li><strong>Beekeeper Studio:</strong> Open-source SQL editor (free)</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma Connection Example</h2>
          <p className="mb-4">
            Here's how you would connect to PostgreSQL using Prisma:
          </p>
          <CodeBlock
            title="Prisma Schema Connection"
            language="prisma"
            code={`// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`}
          />
          <CodeBlock
            title=".env file"
            language="bash"
            code={`DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?schema=public"`}
          />
          <CodeBlock
            title="Prisma Client Usage"
            language="javascript"
            code={`// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma

// Usage in your application
import prisma from './lib/prisma'

// Example: Get all users
const users = await prisma.user.findMany()

// Example: Create a user
const newUser = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
  },
})`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

