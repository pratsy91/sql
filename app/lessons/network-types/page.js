import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Network Address Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL network address types including inet, cidr, and macaddr',
};

export default function NetworkTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Network Address Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Network Type Overview</h2>
          <p className="mb-4">
            PostgreSQL provides specialized types for storing and manipulating network addresses.
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
                <tr className="border-b"><td className="p-2"><code>INET</code></td><td className="p-2">7 or 19 bytes</td><td className="p-2">IPv4 or IPv6 address</td></tr>
                <tr className="border-b"><td className="p-2"><code>CIDR</code></td><td className="p-2">7 or 19 bytes</td><td className="p-2">IPv4 or IPv6 network</td></tr>
                <tr><td className="p-2"><code>MACADDR</code></td><td className="p-2">6 bytes</td><td className="p-2">MAC address</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">INET Type</h2>
          <p className="mb-4">
            INET stores IPv4 or IPv6 addresses, optionally with a subnet mask.
          </p>

          <CodeBlock
            title="SQL: INET Type"
            language="sql"
            code={`-- Create table with INET
CREATE TABLE servers (
  id SERIAL PRIMARY KEY,
  hostname VARCHAR(100),
  ip_address INET,
  ipv6_address INET
);

-- Insert INET values
INSERT INTO servers (hostname, ip_address, ipv6_address)
VALUES 
  ('server1', '192.168.1.100', '2001:0db8:85a3:0000:0000:8a2e:0370:7334'),
  ('server2', '10.0.0.1', '::1'),
  ('server3', '172.16.0.1/24', NULL);

-- Access INET components
SELECT 
  hostname,
  ip_address,
  HOST(ip_address) AS host_part,
  FAMILY(ip_address) AS address_family,  -- 4 for IPv4, 6 for IPv6
  MASKLEN(ip_address) AS mask_length,
  SET_MASKLEN(ip_address, 24) AS with_mask
FROM servers;

-- INET operators
SELECT * FROM servers 
WHERE ip_address = '192.168.1.100';

SELECT * FROM servers 
WHERE ip_address << '192.168.1.0/24'::INET;  -- Contained in network

SELECT * FROM servers 
WHERE ip_address >>= '192.168.1.0/24'::INET;  -- Contains network

SELECT * FROM servers 
WHERE ip_address && '192.168.1.0/24'::INET;  -- Overlaps network

-- INET functions
SELECT 
  ip_address,
  BROADCAST(ip_address) AS broadcast_address,
  NETMASK(ip_address) AS netmask,
  NETWORK(ip_address) AS network_address
FROM servers
WHERE MASKLEN(ip_address) IS NOT NULL;`}
          />
          <CodeBlock
            title="Prisma: INET Type"
            language="prisma"
            code={`// schema.prisma
// Prisma doesn't have native INET support
// Use String or handle in application

model Server {
  id         Int     @id @default(autoincrement())
  hostname   String  @db.VarChar(100)
  ipAddress  String  @map("ip_address") @db.Inet
  ipv6Address String? @map("ipv6_address") @db.Inet
  
  @@map("servers")
}

// Usage
const server = await prisma.server.create({
  data: {
    hostname: 'server1',
    ipAddress: '192.168.1.100',
    ipv6Address: '2001:0db8:85a3::8a2e:0370:7334',
  },
});

// Query with INET operations using raw SQL
const servers = await prisma.$queryRaw\`
  SELECT 
    hostname,
    ip_address,
    HOST(ip_address) AS host_part,
    FAMILY(ip_address) AS address_family
  FROM servers
\`;

// Filter by network
const serversInNetwork = await prisma.$queryRaw\`
  SELECT * FROM servers
  WHERE ip_address << '192.168.1.0/24'::INET
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CIDR Type</h2>
          <p className="mb-4">
            CIDR stores IPv4 or IPv6 network addresses with network mask.
          </p>

          <CodeBlock
            title="SQL: CIDR Type"
            language="sql"
            code={`-- Create table with CIDR
CREATE TABLE networks (
  id SERIAL PRIMARY KEY,
  network_name VARCHAR(100),
  network_cidr CIDR
);

-- Insert CIDR values
INSERT INTO networks (network_name, network_cidr)
VALUES 
  ('LAN', '192.168.1.0/24'),
  ('DMZ', '10.0.0.0/8'),
  ('VPN', '172.16.0.0/12'),
  ('IPv6 Network', '2001:db8::/32');

-- Access CIDR components
SELECT 
  network_name,
  network_cidr,
  HOST(network_cidr) AS network_address,
  MASKLEN(network_cidr) AS mask_length,
  FAMILY(network_cidr) AS address_family
FROM networks;

-- CIDR operators
SELECT * FROM networks 
WHERE network_cidr = '192.168.1.0/24'::CIDR;

SELECT * FROM networks 
WHERE '192.168.1.100'::INET << network_cidr;  -- IP in network

SELECT * FROM networks 
WHERE network_cidr <<= '192.168.0.0/16'::CIDR;  -- Network contained in

SELECT * FROM networks 
WHERE network_cidr && '192.168.1.0/24'::CIDR;  -- Networks overlap

-- CIDR functions
SELECT 
  network_cidr,
  BROADCAST(network_cidr) AS broadcast,
  NETMASK(network_cidr) AS netmask,
  NETWORK(network_cidr) AS network,
  SET_MASKLEN(network_cidr, 16) AS with_new_mask
FROM networks;`}
          />
          <CodeBlock
            title="Prisma: CIDR Type"
            language="prisma"
            code={`// schema.prisma
model Network {
  id          Int     @id @default(autoincrement())
  networkName String  @map("network_name") @db.VarChar(100)
  networkCidr String  @map("network_cidr") @db.Cidr
  
  @@map("networks")
}

// Usage
const network = await prisma.network.create({
  data: {
    networkName: 'LAN',
    networkCidr: '192.168.1.0/24',
  },
});

// Query with CIDR operations
const networks = await prisma.$queryRaw\`
  SELECT 
    network_name,
    network_cidr,
    MASKLEN(network_cidr) AS mask_length
  FROM networks
\`;

// Check if IP is in network
const ipInNetwork = await prisma.$queryRaw\`
  SELECT * FROM networks
  WHERE '192.168.1.100'::INET << network_cidr
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">MACADDR Type</h2>
          <p className="mb-4">
            MACADDR stores MAC (Media Access Control) addresses.
          </p>

          <CodeBlock
            title="SQL: MACADDR Type"
            language="sql"
            code={`-- Create table with MACADDR
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  device_name VARCHAR(100),
  mac_address MACADDR
);

-- Insert MAC addresses (various formats accepted)
INSERT INTO devices (device_name, mac_address)
VALUES 
  ('Device1', '08:00:2b:01:02:03'),
  ('Device2', '08-00-2b-01-02-03'),
  ('Device3', '08002b:010203'),
  ('Device4', '08002b-010203'),
  ('Device5', '0800.2b01.0203');

-- All formats are normalized to '08:00:2b:01:02:03'
SELECT 
  device_name,
  mac_address,
  mac_address::text AS mac_text
FROM devices;

-- MAC address functions
SELECT 
  mac_address,
  TRUNC(mac_address) AS truncated_mac  -- Sets last 3 bytes to zero
FROM devices;

-- MAC address operators
SELECT * FROM devices 
WHERE mac_address = '08:00:2b:01:02:03'::MACADDR;

SELECT * FROM devices 
WHERE mac_address < '08:00:2b:ff:ff:ff'::MACADDR;

-- Practical example: Find devices by vendor (first 3 bytes)
SELECT 
  device_name,
  mac_address,
  TRUNC(mac_address) AS vendor_prefix
FROM devices
WHERE TRUNC(mac_address) = '08:00:2b:00:00:00'::MACADDR;`}
          />
          <CodeBlock
            title="Prisma: MACADDR Type"
            language="prisma"
            code={`// schema.prisma
model Device {
  id         Int     @id @default(autoincrement())
  deviceName String  @map("device_name") @db.VarChar(100)
  macAddress String  @map("mac_address") @db.MacAddr
  
  @@map("devices")
}

// Usage
const device = await prisma.device.create({
  data: {
    deviceName: 'Device1',
    macAddress: '08:00:2b:01:02:03',
  },
});

// Query MAC addresses
const devices = await prisma.$queryRaw\`
  SELECT 
    device_name,
    mac_address,
    mac_address::text AS mac_text
  FROM devices
\`;

// Filter by MAC address
const device = await prisma.device.findFirst({
  where: {
    macAddress: '08:00:2b:01:02:03',
  },
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Network Functions</h2>

          <CodeBlock
            title="SQL: Network Functions"
            language="sql"
            code={`-- Create test data
CREATE TABLE network_test (
  id SERIAL PRIMARY KEY,
  ip INET,
  network CIDR
);

INSERT INTO network_test (ip, network)
VALUES 
  ('192.168.1.100', '192.168.1.0/24'),
  ('10.0.0.5', '10.0.0.0/8');

-- Network address functions
SELECT 
  ip,
  HOST(ip) AS host,
  NETMASK(ip) AS netmask,
  NETWORK(ip) AS network,
  BROADCAST(ip) AS broadcast,
  MASKLEN(ip) AS mask_length,
  FAMILY(ip) AS family,  -- 4 for IPv4, 6 for IPv6
  SET_MASKLEN(ip, 16) AS with_mask_16
FROM network_test
WHERE MASKLEN(ip) IS NOT NULL;

-- Text conversion
SELECT 
  ip,
  ip::text AS ip_text,
  network,
  network::text AS network_text,
  '192.168.1.100'::INET AS from_text
FROM network_test;

-- Abbreviation functions
SELECT 
  '192.168.1.0'::INET AS full_ip,
  ABBREV('192.168.1.0'::INET) AS abbreviated;

-- Practical example: IP access control
CREATE TABLE access_logs (
  id SERIAL PRIMARY KEY,
  ip_address INET,
  access_time TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO access_logs (ip_address)
VALUES 
  ('192.168.1.100'),
  ('192.168.1.101'),
  ('10.0.0.5');

-- Find IPs in specific network
SELECT * FROM access_logs
WHERE ip_address << '192.168.1.0/24'::INET;

-- Count accesses by network
SELECT 
  SET_MASKLEN(ip_address, 24) AS network_24,
  COUNT(*) AS access_count
FROM access_logs
GROUP BY SET_MASKLEN(ip_address, 24);`}
          />
          <CodeBlock
            title="Prisma: Network Functions"
            language="javascript"
            code={`// Use raw SQL for network functions

// schema.prisma
model AccessLog {
  id         Int       @id @default(autoincrement())
  ipAddress  String    @map("ip_address") @db.Inet
  accessTime DateTime  @default(now()) @map("access_time") @db.Timestamptz(6)
  
  @@map("access_logs")
}

// Network operations
const logs = await prisma.$queryRaw\`
  SELECT 
    ip_address,
    HOST(ip_address) AS host,
    MASKLEN(ip_address) AS mask_length,
    FAMILY(ip_address) AS family
  FROM access_logs
\`;

// Filter by network
const logsInNetwork = await prisma.$queryRaw\`
  SELECT * FROM access_logs
  WHERE ip_address << '192.168.1.0/24'::INET
\`;

// Group by network
const networkStats = await prisma.$queryRaw\`
  SELECT 
    SET_MASKLEN(ip_address, 24) AS network_24,
    COUNT(*) AS access_count
  FROM access_logs
  GROUP BY SET_MASKLEN(ip_address, 24)
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use INET</strong> for storing IP addresses</li>
              <li><strong>Use CIDR</strong> for network ranges and subnets</li>
              <li><strong>Use MACADDR</strong> for hardware addresses</li>
              <li><strong>Index network columns</strong> for efficient queries</li>
              <li><strong>Use network operators</strong> (<code>&lt;&lt;</code>, <code>&gt;&gt;=</code>, <code>&amp;&amp;</code>) for network membership checks</li>
              <li><strong>Validate input</strong> - PostgreSQL validates network address formats</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

