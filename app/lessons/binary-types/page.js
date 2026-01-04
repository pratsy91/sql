import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Binary Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL BYTEA type for storing binary data and encoding/decoding operations',
};

export default function BinaryTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Binary Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">BYTEA Type Overview</h2>
          <p className="mb-4">
            The BYTEA type stores binary data (byte strings) of variable length. It's useful for storing 
            images, files, encrypted data, or any binary content.
          </p>
          
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Storage</th>
                  <th className="text-left p-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2"><code>BYTEA</code></td>
                  <td className="p-2">1-4 bytes + actual data</td>
                  <td className="p-2">Variable-length binary data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Creating BYTEA Columns</h2>

          <CodeBlock
            title="SQL: BYTEA Type"
            language="sql"
            code={`-- Create table with BYTEA
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255),
  file_data BYTEA,
  thumbnail BYTEA,
  metadata BYTEA
);

-- Insert binary data using escape format
INSERT INTO files (filename, file_data)
VALUES 
  ('document.pdf', E'\\xDEADBEEF'),
  ('image.png', E'\\x89504E470D0A1A0A'),
  ('data.bin', E'\\x48656C6C6F20576F726C64');

-- Insert using hex format (preferred)
INSERT INTO files (filename, file_data)
VALUES 
  ('file1.bin', '\\xDEADBEEF'),
  ('file2.bin', '\\x48656C6C6F');

-- Insert NULL
INSERT INTO files (filename, file_data)
VALUES ('empty.txt', NULL);

-- Query binary data
SELECT 
  id,
  filename,
  LENGTH(file_data) AS data_length,
  OCTET_LENGTH(file_data) AS octet_length
FROM files;

-- Get binary data as hex string
SELECT 
  filename,
  ENCODE(file_data, 'hex') AS hex_encoded
FROM files;

-- Get binary data as base64
SELECT 
  filename,
  ENCODE(file_data, 'base64') AS base64_encoded
FROM files;`}
          />
          <CodeBlock
            title="Prisma: BYTEA Type"
            language="prisma"
            code={`// schema.prisma
model File {
  id        Int     @id @default(autoincrement())
  filename  String  @db.VarChar(255)
  fileData  Bytes   @map("file_data") @db.ByteA
  thumbnail Bytes?  @db.ByteA
  metadata  Bytes?   @db.ByteA
  
  @@map("files")
}

// Usage with Buffer (Node.js)
const file = await prisma.file.create({
  data: {
    filename: 'document.pdf',
    fileData: Buffer.from('Hello World', 'utf8'),
  },
});

// Read file from filesystem
import fs from 'fs';

const imageBuffer = fs.readFileSync('./image.png');
const imageFile = await prisma.file.create({
  data: {
    filename: 'image.png',
    fileData: imageBuffer,
    thumbnail: imageBuffer,  // In real app, create thumbnail
  },
});

// Query and retrieve binary data
const file = await prisma.file.findUnique({
  where: { id: 1 },
});

if (file) {
  // file.fileData is a Buffer
  fs.writeFileSync('./output.pdf', file.fileData);
}

// Convert to base64 for API responses
const fileWithBase64 = await prisma.$queryRaw\`
  SELECT 
    id,
    filename,
    ENCODE(file_data, 'base64') AS base64_data
  FROM files
  WHERE id = 1
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Encoding and Decoding</h2>
          <p className="mb-4">
            PostgreSQL provides functions to encode and decode BYTEA data in various formats.
          </p>

          <CodeBlock
            title="SQL: Encoding/Decoding Functions"
            language="sql"
            code={`-- Create table for examples
CREATE TABLE encoded_data (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  binary_data BYTEA
);

-- Insert some binary data
INSERT INTO encoded_data (name, binary_data)
VALUES 
  ('test1', '\\x48656C6C6F'),  -- "Hello" in hex
  ('test2', '\\x576F726C64');  -- "World" in hex

-- ENCODE function - convert BYTEA to text
SELECT 
  name,
  binary_data,
  ENCODE(binary_data, 'hex') AS hex_encoded,
  ENCODE(binary_data, 'base64') AS base64_encoded,
  ENCODE(binary_data, 'escape') AS escape_encoded
FROM encoded_data;

-- DECODE function - convert text to BYTEA
SELECT 
  DECODE('48656C6C6F', 'hex') AS from_hex,
  DECODE('SGVsbG8=', 'base64') AS from_base64,
  DECODE('Hello', 'escape') AS from_escape;

-- Convert text to BYTEA
SELECT 
  'Hello World'::BYTEA AS text_to_bytes,
  CONVERT_TO('Hello World', 'UTF8') AS convert_to_utf8;

-- Convert BYTEA to text
SELECT 
  CONVERT_FROM('\\x48656C6C6F20576F726C64', 'UTF8') AS bytes_to_text;

-- Practical example: Store and retrieve text as binary
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  message_text TEXT,
  message_bytes BYTEA
);

INSERT INTO messages (message_text, message_bytes)
VALUES 
  ('Hello', 'Hello'::BYTEA),
  ('World', CONVERT_TO('World', 'UTF8'));

SELECT 
  message_text,
  message_bytes,
  CONVERT_FROM(message_bytes, 'UTF8') AS decoded_text
FROM messages;`}
          />
          <CodeBlock
            title="Prisma: Encoding/Decoding"
            language="javascript"
            code={`// Prisma handles BYTEA as Buffer in Node.js
// Encoding/decoding is done in application code

// schema.prisma
model EncodedData {
  id          Int    @id @default(autoincrement())
  name        String @db.VarChar(100)
  binaryData  Bytes  @map("binary_data") @db.ByteA
  
  @@map("encoded_data")
}

// Encode text to binary
const text = 'Hello World';
const buffer = Buffer.from(text, 'utf8');

const data = await prisma.encodedData.create({
  data: {
    name: 'test1',
    binaryData: buffer,
  },
});

// Decode binary to text
const record = await prisma.encodedData.findUnique({
  where: { id: 1 },
});

if (record) {
  const text = record.binaryData.toString('utf8');
  console.log(text);  // "Hello World"
}

// Encode to hex
const hexString = record.binaryData.toString('hex');
console.log(hexString);  // "48656c6c6f20576f726c64"

// Encode to base64
const base64String = record.binaryData.toString('base64');
console.log(base64String);  // "SGVsbG8gV29ybGQ="

// Decode from hex
const fromHex = Buffer.from('48656c6c6f', 'hex');
await prisma.encodedData.create({
  data: {
    name: 'from_hex',
    binaryData: fromHex,
  },
});

// Decode from base64
const fromBase64 = Buffer.from('SGVsbG8=', 'base64');
await prisma.encodedData.create({
  data: {
    name: 'from_base64',
    binaryData: fromBase64,
  },
});

// Using raw SQL for encoding
const encoded = await prisma.$queryRaw\`
  SELECT 
    name,
    ENCODE(binary_data, 'hex') AS hex_encoded,
    ENCODE(binary_data, 'base64') AS base64_encoded
  FROM encoded_data
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Binary Operations</h2>

          <CodeBlock
            title="SQL: Binary Operations"
            language="sql"
            code={`-- Create table
CREATE TABLE binary_examples (
  id SERIAL PRIMARY KEY,
  data1 BYTEA,
  data2 BYTEA
);

INSERT INTO binary_examples (data1, data2)
VALUES 
  ('\\x48656C6C6F', '\\x576F726C64'),
  ('\\x010203', '\\x040506');

-- Concatenation
SELECT 
  data1,
  data2,
  data1 || data2 AS concatenated
FROM binary_examples;

-- Length
SELECT 
  data1,
  LENGTH(data1) AS length,
  OCTET_LENGTH(data1) AS octet_length
FROM binary_examples;

-- Substring (get bytes)
SELECT 
  data1,
  SUBSTRING(data1 FROM 1 FOR 2) AS first_two_bytes,
  SUBSTRING(data1 FROM 3) AS from_third_byte
FROM binary_examples;

-- Get byte at position (1-indexed)
SELECT 
  data1,
  GET_BYTE(data1, 0) AS first_byte,
  GET_BYTE(data1, 1) AS second_byte
FROM binary_examples;

-- Set byte at position
SELECT 
  data1,
  SET_BYTE(data1, 0, 65) AS modified_data
FROM binary_examples;

-- Comparison
SELECT * FROM binary_examples 
WHERE data1 = '\\x48656C6C6F';

SELECT * FROM binary_examples 
WHERE data1 < data2;

-- Pattern matching (bytea_pattern_ops)
CREATE INDEX idx_binary_pattern ON binary_examples 
USING btree (data1 bytea_pattern_ops);

-- Search for pattern
SELECT * FROM binary_examples 
WHERE data1 LIKE '\\x48%';`}
          />
          <CodeBlock
            title="Prisma: Binary Operations"
            language="javascript"
            code={`// Binary operations in application code

// schema.prisma
model BinaryExample {
  id    Int    @id @default(autoincrement())
  data1 Bytes  @db.ByteA
  data2 Bytes? @db.ByteA
  
  @@map("binary_examples")
}

// Concatenation
const data1 = Buffer.from('Hello', 'utf8');
const data2 = Buffer.from('World', 'utf8');
const concatenated = Buffer.concat([data1, data2]);

await prisma.binaryExample.create({
  data: {
    data1: concatenated,
  },
});

// Length
const record = await prisma.binaryExample.findUnique({
  where: { id: 1 },
});

if (record) {
  const length = record.data1.length;
  console.log('Length:', length);
}

// Substring (slice)
const sliced = record.data1.slice(0, 2);

// Get byte at position
const firstByte = record.data1[0];
const secondByte = record.data1[1];

// Set byte at position
const modified = Buffer.from(record.data1);
modified[0] = 65;  // Set first byte to 'A'

await prisma.binaryExample.update({
  where: { id: 1 },
  data: { data1: modified },
});

// Comparison
const matching = await prisma.binaryExample.findMany({
  where: {
    data1: Buffer.from('Hello', 'utf8'),
  },
});

// Using raw SQL for binary operations
const results = await prisma.$queryRaw\`
  SELECT 
    data1,
    data2,
    data1 || data2 AS concatenated,
    LENGTH(data1) AS length
  FROM binary_examples
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Use Cases</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">Common Use Cases:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>File Storage:</strong> Store images, PDFs, documents</li>
              <li><strong>Encrypted Data:</strong> Store encrypted passwords, tokens</li>
              <li><strong>Binary Formats:</strong> Store protocol buffers, binary serialized data</li>
              <li><strong>Media Files:</strong> Store audio, video files (though often better to store paths)</li>
              <li><strong>Hashes:</strong> Store cryptographic hashes (MD5, SHA-256, etc.)</li>
            </ul>
          </div>

          <CodeBlock
            title="SQL: Practical Examples"
            language="sql"
            code={`-- Store file with metadata
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255),
  content_type VARCHAR(100),
  file_size INTEGER,
  file_data BYTEA,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store encrypted password hash
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  password_hash BYTEA,  -- Store bcrypt/scrypt hash
  salt BYTEA
);

-- Store image thumbnail
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  image_data BYTEA,
  thumbnail BYTEA
);

-- Query with size limits
SELECT 
  filename,
  file_size,
  LENGTH(file_data) AS actual_size
FROM documents
WHERE LENGTH(file_data) > 1048576;  -- Files larger than 1MB

-- Extract first N bytes (for preview)
SELECT 
  filename,
  SUBSTRING(file_data FROM 1 FOR 100) AS preview_bytes
FROM documents;`}
          />
          <CodeBlock
            title="Prisma: Practical Examples"
            language="javascript"
            code={`// File storage example
// schema.prisma
model Document {
  id          Int       @id @default(autoincrement())
  filename    String    @db.VarChar(255)
  contentType String    @map("content_type") @db.VarChar(100)
  fileSize    Int       @map("file_size")
  fileData    Bytes     @map("file_data") @db.ByteA
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  
  @@map("documents")
}

// Store file
import fs from 'fs';
import crypto from 'crypto';

const fileBuffer = fs.readFileSync('./document.pdf');
const hash = crypto.createHash('sha256').update(fileBuffer).digest();

const document = await prisma.document.create({
  data: {
    filename: 'document.pdf',
    contentType: 'application/pdf',
    fileSize: fileBuffer.length,
    fileData: fileBuffer,
  },
});

// Retrieve and save file
const doc = await prisma.document.findUnique({
  where: { id: 1 },
});

if (doc) {
  fs.writeFileSync('./output/' + doc.filename, doc.fileData);
}

// Password hashing example
import bcrypt from 'bcrypt';

const password = 'myPassword123';
const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);
const hashBuffer = Buffer.from(hash, 'utf8');

// Store hash
await prisma.user.create({
  data: {
    username: 'alice',
    passwordHash: hashBuffer,
  },
});

// Verify password
const user = await prisma.user.findUnique({
  where: { username: 'alice' },
});

if (user) {
  const hashString = user.passwordHash.toString('utf8');
  const isValid = await bcrypt.compare(password, hashString);
}`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Consider file storage:</strong> For large files, consider storing paths and using object storage (S3, etc.)</li>
              <li><strong>Size limits:</strong> BYTEA can store up to 1GB, but very large values impact performance</li>
              <li><strong>Indexing:</strong> BYTEA columns can be indexed, but consider if you really need to search binary data</li>
              <li><strong>Encoding:</strong> Use hex format ('\x...') for readability in SQL</li>
              <li><strong>Base64:</strong> Use base64 encoding when transferring over APIs</li>
              <li><strong>Compression:</strong> Consider compressing large binary data before storage</li>
              <li><strong>Security:</strong> Be careful with binary data in queries to avoid injection</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

