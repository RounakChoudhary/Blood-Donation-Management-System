const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET;

async function register(req, res) {
  try {
    const { full_name, email, password, phone } = req.body;

    // basic validation
    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // check existing user
    const existing = await User.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // hash password
    const password_hash = await bcrypt.hash(password, 10);

    // create user
    const user = await User.createUser({
      full_name,
      email,
      password_hash,
      phone,
    });

    // create JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // find user
    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // issue JWT
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { register, login };