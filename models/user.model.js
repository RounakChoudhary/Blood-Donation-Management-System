const pool = require("./db");

async function createUser(){
    const query =`
    INSERT INTO users (full_name, email, password, phone, location)
    VALUES ($1, $2, $3, $4, ST_MakePoint($5, $6)::geography)
    RETURNING id, full_name, email, phone, created_at
    `;
    const values = [full_name, email, password, phone, lon, lat];
    const { rows } = await pool.query(query, values);
    return rows[0];
}

// find user by email 
async function getUserByEmail(email){
    const { rows } =await pool.query(
        `SELECT * FROM users WHERE email = $1`, [email]
    );
    return rows[0] || null;
}

module.exports ={
    createUser, getUserByEmail,
};