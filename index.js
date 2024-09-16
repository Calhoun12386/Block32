//all routes working with crul and postman
//To test CREATE, run this command: curl localhost:3000/api/flavors -X POST -d '{"name": "mint", "is_favorite": true}' -H "Content-Type:application/json"
//To test READ ALL, run this command: curl localhost:3000/api/flavors
//To test READ ONE, run this command: curl localhost:3000/api/flavors/1
//To test UPDATE, run this command: curl localhost:3000/api/flavors/4 -X PUT -d '{"name": "mint chip", "is_favorite": false}' -H "Content-Type:application/json"
//To test DELETE, run this command: curl localhost:3000/api/flavors/4 -X DELETE

const pg = require("pg");
const express = require("express");
const morgan = require("morgan");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/flavors_db"
);

const app = express();

// Middleware to parse JSON and log HTTP requests
app.use(express.json());
app.use(morgan("dev"));

// POST /api/flavors - Create a new flavor
app.post("/api/flavors", async (req, res, next) => {
    try {
      const { name, is_favorite } = req.body;
      const SQL = `INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *;`;
      const response = await client.query(SQL, [name, is_favorite]);
      res.send(response.rows[0]); // Send the created flavor
    } catch (err) {
      next(err);
    }
  });

  // GET /api/flavors - Get all flavors
app.get("/api/flavors", async (req, res, next) => {
    try {
      const SQL = `SELECT * FROM flavors ORDER BY created_at DESC;`;
      const response = await client.query(SQL);
      res.send(response.rows); // Send the array of flavors
    } catch (err) {
      next(err);
    }
  });

// GET /api/flavors/:id - Get a single flavor by ID
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const SQL = `SELECT * FROM flavors WHERE id=$1;`;
    const response = await client.query(SQL, [id]);
    if (response.rows.length) {
      res.send(response.rows[0]);
    } else {
      res.status(404).send({ error: 'Flavor not found' });
    }
  } catch (err) {
    next(err);
  }
});


  // PUT /api/flavors/:id - Update a flavor by ID
app.put("/api/flavors/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, is_favorite } = req.body;
      const SQL = `
        UPDATE flavors
        SET name=$1, is_favorite=$2, updated_at=now()
        WHERE id=$3 RETURNING *;
      `;
      const response = await client.query(SQL, [name, is_favorite, id]);
      res.send(response.rows[0]); // Send the updated flavor
    } catch (err) {
      next(err);
    }
  });
  
  // DELETE /api/flavors/:id - Delete a flavor by ID
  app.delete("/api/flavors/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const SQL = `DELETE FROM flavors WHERE id=$1;`;
      await client.query(SQL, [id]);
      res.sendStatus(204); 
    } catch (err) {
      next(err);
    }
  });

const init = async () => {
  try {
    await client.connect();
    console.log("Connected to database");

    // Drop the table if it exists and create it again
    let SQL = `
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `;
    await client.query(SQL);
    console.log("Table created");

    // Seed the table with some data
    SQL = `
      INSERT INTO flavors (name, is_favorite) VALUES ('Vanilla', true);
      INSERT INTO flavors (name, is_favorite) VALUES ('Chocolate', false);
      INSERT INTO flavors (name, is_favorite) VALUES ('Strawberry', true);
    `;
    await client.query(SQL);
    console.log("Data seeded");
  } catch (err) {
    console.error(err);
  }
// Start server
  const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

};

init();