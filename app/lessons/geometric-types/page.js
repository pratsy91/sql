import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Geometric Types - PostgreSQL Learning',
  description: 'Learn about PostgreSQL geometric data types including point, line, box, path, polygon, and circle',
};

export default function GeometricTypes() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Geometric Types</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Geometric Type Overview</h2>
          <p className="mb-4">
            PostgreSQL provides geometric data types for storing and manipulating 2D spatial data.
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
                <tr className="border-b"><td className="p-2"><code>POINT</code></td><td className="p-2">16 bytes</td><td className="p-2">Point (x, y)</td></tr>
                <tr className="border-b"><td className="p-2"><code>LINE</code></td><td className="p-2">32 bytes</td><td className="p-2">Infinite line</td></tr>
                <tr className="border-b"><td className="p-2"><code>LSEG</code></td><td className="p-2">32 bytes</td><td className="p-2">Line segment</td></tr>
                <tr className="border-b"><td className="p-2"><code>BOX</code></td><td className="p-2">32 bytes</td><td className="p-2">Rectangular box</td></tr>
                <tr className="border-b"><td className="p-2"><code>PATH</code></td><td className="p-2">16+ bytes</td><td className="p-2">Open or closed path</td></tr>
                <tr className="border-b"><td className="p-2"><code>POLYGON</code></td><td className="p-2">40+ bytes</td><td className="p-2">Polygon</td></tr>
                <tr><td className="p-2"><code>CIRCLE</code></td><td className="p-2">24 bytes</td><td className="p-2">Circle (center, radius)</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">POINT Type</h2>
          <p className="mb-4">
            POINT represents a point in 2D space with x and y coordinates.
          </p>

          <CodeBlock
            title="SQL: POINT Type"
            language="sql"
            code={`-- Create table with POINT
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  coordinates POINT
);

-- Insert point values
INSERT INTO locations (name, coordinates)
VALUES 
  ('Home', '(10, 20)'),
  ('Office', POINT(30, 40)),
  ('Park', '(50.5, 60.7)');

-- Access point coordinates
SELECT 
  name,
  coordinates,
  (coordinates).x AS x_coordinate,
  (coordinates).y AS y_coordinate
FROM locations;

-- Point functions
SELECT 
  name,
  coordinates,
  POINT(0, 0) AS origin,
  coordinates <-> POINT(0, 0) AS distance_from_origin
FROM locations;

-- Point operators
SELECT * FROM locations 
WHERE coordinates <-> POINT(0, 0) < 50;  -- Within 50 units of origin

SELECT * FROM locations 
WHERE coordinates = POINT(30, 40);

-- Create index for point queries
CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);`}
          />
          <CodeBlock
            title="Prisma: POINT Type"
            language="prisma"
            code={`// schema.prisma
// Prisma doesn't have native POINT support
// Use PostGIS extension or store as separate x, y columns

model Location {
  id    Int     @id @default(autoincrement())
  name  String  @db.VarChar(100)
  x     Float   // X coordinate
  y     Float   // Y coordinate
  
  @@map("locations")
}

// Or use raw SQL with PostGIS
// Install PostGIS extension first: CREATE EXTENSION postgis;

// Usage
const location = await prisma.location.create({
  data: {
    name: 'Home',
    x: 10,
    y: 20,
  },
});

// Calculate distance
const locations = await prisma.$queryRaw\`
  SELECT 
    name,
    x,
    y,
    SQRT(x * x + y * y) AS distance_from_origin
  FROM locations
\`;

// Query nearby points
const nearby = await prisma.$queryRaw\`
  SELECT 
    name,
    x,
    y,
    SQRT(POWER(x - 0, 2) + POWER(y - 0, 2)) AS distance
  FROM locations
  WHERE SQRT(POWER(x - 0, 2) + POWER(y - 0, 2)) < 50
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">LINE, LSEG, BOX Types</h2>

          <CodeBlock
            title="SQL: LINE, LSEG, BOX Types"
            language="sql"
            code={`-- Create table with geometric types
CREATE TABLE shapes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  line_shape LINE,
  segment LSEG,
  bounding_box BOX
);

-- Insert values
INSERT INTO shapes (name, line_shape, segment, bounding_box)
VALUES 
  ('Shape1', LINE '{1,2,3}', LSEG '[(0,0),(10,10)]', BOX '(5,5),(15,15)'),
  ('Shape2', LINE '{0,1,0}', LSEG '[(1,1),(20,20)]', BOX '(0,0),(10,10)');

-- Access components
SELECT 
  name,
  segment,
  (segment).p1 AS start_point,
  (segment).p2 AS end_point,
  bounding_box,
  (bounding_box).upper AS upper_right,
  (bounding_box).lower AS lower_left
FROM shapes;

-- Geometric operators
SELECT * FROM shapes 
WHERE bounding_box @> POINT(5, 5);  -- Point contained in box

SELECT * FROM shapes 
WHERE segment && LSEG '[(5,5),(15,15)]';  -- Segments overlap

-- Box functions
SELECT 
  name,
  bounding_box,
  AREA(bounding_box) AS box_area,
  WIDTH(bounding_box) AS box_width,
  HEIGHT(bounding_box) AS box_height
FROM shapes;`}
          />
          <CodeBlock
            title="Prisma: LINE, LSEG, BOX Types"
            language="prisma"
            code={`// Prisma doesn't have native geometric type support
// Use PostGIS or store as text/JSON

// schema.prisma
model Shape {
  id          Int     @id @default(autoincrement())
  name        String  @db.VarChar(100)
  segment     String  @db.Text  // Store as text: '[(0,0),(10,10)]'
  boundingBox String  @map("bounding_box") @db.Text  // Store as text: '(5,5),(15,15)'
  
  @@map("shapes")
}

// Use raw SQL for geometric operations
const shapes = await prisma.$queryRaw\`
  SELECT 
    name,
    segment::lseg,
    bounding_box::box,
    AREA(bounding_box::box) AS box_area
  FROM shapes
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">PATH and POLYGON Types</h2>

          <CodeBlock
            title="SQL: PATH and POLYGON Types"
            language="sql"
            code={`-- Create table
CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  boundary_path PATH,
  area_polygon POLYGON
);

-- Insert path (open or closed)
INSERT INTO regions (name, boundary_path, area_polygon)
VALUES 
  ('Region1', PATH '[(0,0),(10,0),(10,10),(0,10)]', POLYGON '((0,0),(10,0),(10,10),(0,10))'),
  ('Region2', PATH '((5,5),(15,5),(15,15),(5,15))', POLYGON '((5,5),(15,5),(15,15),(5,15))');

-- Path functions
SELECT 
  name,
  boundary_path,
  ISOPEN(boundary_path) AS is_open,
  ISCLOSED(boundary_path) AS is_closed,
  NPOINTS(boundary_path) AS point_count,
  AREA(boundary_path) AS path_area
FROM regions;

-- Polygon functions
SELECT 
  name,
  area_polygon,
  NPOINTS(area_polygon) AS vertex_count,
  AREA(area_polygon) AS polygon_area,
  CENTER(area_polygon) AS center_point
FROM regions;

-- Geometric operations
SELECT * FROM regions 
WHERE area_polygon @> POINT(7, 7);  -- Point in polygon

SELECT * FROM regions 
WHERE area_polygon && BOX '(2,2),(8,8)';  -- Overlaps with box`}
          />
          <CodeBlock
            title="Prisma: PATH and POLYGON Types"
            language="prisma"
            code={`// Use PostGIS for better polygon support
// Or store as text/JSON

// schema.prisma
model Region {
  id          Int     @id @default(autoincrement())
  name        String  @db.VarChar(100)
  boundaryPath String @map("bounding_path") @db.Text
  areaPolygon String  @map("area_polygon") @db.Text
  
  @@map("regions")
}

// Use raw SQL for geometric operations
const regions = await prisma.$queryRaw\`
  SELECT 
    name,
    area_polygon::polygon,
    AREA(area_polygon::polygon) AS polygon_area,
    NPOINTS(area_polygon::polygon) AS vertex_count
  FROM regions
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">CIRCLE Type</h2>

          <CodeBlock
            title="SQL: CIRCLE Type"
            language="sql"
            code={`-- Create table with CIRCLE
CREATE TABLE circles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  circle_shape CIRCLE
);

-- Insert circle values
INSERT INTO circles (name, circle_shape)
VALUES 
  ('Circle1', CIRCLE '((0,0), 10)'),      -- Center at (0,0), radius 10
  ('Circle2', CIRCLE '((5,5), 5)'),       -- Center at (5,5), radius 5
  ('Circle3', '<(10,10), 3>');            -- Alternative syntax

-- Access circle components
SELECT 
  name,
  circle_shape,
  (circle_shape).center AS center_point,
  (circle_shape).radius AS radius_value
FROM circles;

-- Circle functions
SELECT 
  name,
  circle_shape,
  AREA(circle_shape) AS circle_area,
  RADIUS(circle_shape) AS radius,
  DIAMETER(circle_shape) AS diameter
FROM circles;

-- Circle operators
SELECT * FROM circles 
WHERE circle_shape @> POINT(2, 2);  -- Point in circle

SELECT * FROM circles 
WHERE circle_shape && CIRCLE '((0,0), 15)';  -- Circles overlap

-- Distance between circles
SELECT 
  c1.name AS circle1,
  c2.name AS circle2,
  c1.circle_shape <-> c2.circle_shape AS distance
FROM circles c1, circles c2
WHERE c1.id < c2.id;`}
          />
          <CodeBlock
            title="Prisma: CIRCLE Type"
            language="prisma"
            code={`// schema.prisma
model Circle {
  id          Int     @id @default(autoincrement())
  name        String  @db.VarChar(100)
  centerX     Float   @map("center_x")
  centerY     Float   @map("center_y")
  radius      Float
  
  @@map("circles")
}

// Usage
const circle = await prisma.circle.create({
  data: {
    name: 'Circle1',
    centerX: 0,
    centerY: 0,
    radius: 10,
  },
});

// Calculate area
const circles = await prisma.$queryRaw\`
  SELECT 
    name,
    center_x,
    center_y,
    radius,
    PI() * radius * radius AS circle_area
  FROM circles
\`;

// Check if point is in circle
const pointInCircle = await prisma.$queryRaw\`
  SELECT 
    name,
    center_x,
    center_y,
    radius,
    SQRT(POWER(center_x - 2, 2) + POWER(center_y - 2, 2)) <= radius AS contains_point
  FROM circles
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Geometric Operators and Functions</h2>

          <CodeBlock
            title="SQL: Geometric Operators"
            language="sql"
            code={`-- Create test data
CREATE TABLE test_geometry (
  id SERIAL PRIMARY KEY,
  point1 POINT,
  point2 POINT,
  box1 BOX,
  box2 BOX
);

INSERT INTO test_geometry (point1, point2, box1, box2)
VALUES 
  (POINT(0, 0), POINT(10, 10), BOX '(0,0),(5,5)', BOX '(3,3),(8,8)');

-- Distance operators
SELECT 
  point1 <-> point2 AS distance,
  point1 <#> point2 AS manhattan_distance,
  point1 <=> point2 AS distance_squared
FROM test_geometry;

-- Containment operators
SELECT 
  box1 @> POINT(2, 2) AS point_in_box,
  box1 @> box2 AS box_contains_box,
  box1 <@ box2 AS box_contained_in_box
FROM test_geometry;

-- Overlap operator
SELECT 
  box1 && box2 AS boxes_overlap
FROM test_geometry;

-- Geometric functions
SELECT 
  POINT(0, 0) AS origin,
  POINT(3, 4) AS point,
  POINT(0, 0) <-> POINT(3, 4) AS distance,
  AREA(BOX '(0,0),(3,4)') AS box_area,
  WIDTH(BOX '(0,0),(10,5)') AS box_width,
  HEIGHT(BOX '(0,0),(10,5)') AS box_height;

-- Practical example: Find points in bounding box
CREATE TABLE map_points (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  location POINT
);

INSERT INTO map_points (name, location)
VALUES 
  ('A', POINT(5, 5)),
  ('B', POINT(15, 15)),
  ('C', POINT(7, 7));

-- Find points in bounding box
SELECT * FROM map_points
WHERE location <@ BOX '(0,0),(10,10)';

-- Create GIST index for geometric queries
CREATE INDEX idx_map_points_location ON map_points USING GIST (location);`}
          />
          <CodeBlock
            title="Prisma: Geometric Operations"
            language="javascript"
            code={`// Use raw SQL for geometric operations

// schema.prisma
model MapPoint {
  id       Int     @id @default(autoincrement())
  name     String  @db.VarChar(100)
  locationX Float  @map("location_x")
  locationY Float  @map("location_y")
  
  @@map("map_points")
}

// Distance calculation
const points = await prisma.$queryRaw\`
  SELECT 
    name,
    location_x,
    location_y,
    SQRT(POWER(location_x - 0, 2) + POWER(location_y - 0, 2)) AS distance_from_origin
  FROM map_points
\`;

// Points in bounding box
const pointsInBox = await prisma.$queryRaw\`
  SELECT * FROM map_points
  WHERE location_x >= 0 AND location_x <= 10
    AND location_y >= 0 AND location_y <= 10
\`;

// Or use PostGIS for advanced operations
// CREATE EXTENSION postgis;
// Then use geography/geometry types`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">PostGIS Extension</h2>
          <p className="mb-4">
            For advanced geometric operations, consider using the PostGIS extension which provides 
            more powerful spatial data types and functions.
          </p>

          <CodeBlock
            title="SQL: PostGIS Usage"
            language="sql"
            code={`-- Install PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- PostGIS provides geography and geometry types
CREATE TABLE postgis_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  location GEOGRAPHY(POINT, 4326),  -- WGS84 coordinate system
  area GEOMETRY(POLYGON, 4326)
);

-- Insert with PostGIS
INSERT INTO postgis_locations (name, location, area)
VALUES 
  ('Location1', ST_GeogFromText('POINT(-122.4194 37.7749)'), 
   ST_GeomFromText('POLYGON((-122.5 37.7, -122.4 37.7, -122.4 37.8, -122.5 37.8, -122.5 37.7))', 4326));

-- PostGIS functions
SELECT 
  name,
  ST_AsText(location) AS location_text,
  ST_Distance(location, ST_GeogFromText('POINT(-122.0 38.0)')) AS distance_meters
FROM postgis_locations;

-- Spatial queries
SELECT * FROM postgis_locations
WHERE ST_DWithin(location, ST_GeogFromText('POINT(-122.0 38.0)'), 50000);  -- Within 50km`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use PostGIS</strong> for production spatial applications</li>
              <li><strong>Create GIST indexes</strong> on geometric columns for better query performance</li>
              <li><strong>Consider coordinate systems</strong> - PostGIS handles this better than built-in types</li>
              <li><strong>Use appropriate types</strong> - POINT for locations, POLYGON for areas</li>
              <li><strong>Index geometric columns</strong> using GIST for spatial queries</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

