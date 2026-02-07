const express = require("express");
const app = express();
const PORT = 3000;
require("./models/db");
const pool = require("./models/db");

app.get("/health", async (req, res) => {
  const result = await pool.query("SELECT current_database() db, NOW() time");
  res.json(result.rows[0]);
});


app.use(express.json());

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})