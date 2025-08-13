const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const MongoStore = require('connect-mongo');
const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// MONGODB CONNECTION
// =====================
// Make sure credentials are URL-encoded if they contain special characters
const MONGO_URI ='mongodb+srv://stephen:Jisoo123@cluster0.qg0mzhz.mongodb.net/dbname?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {

})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// =====================
// SCHEMA & MODEL
// =====================
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  age: Number,
  password: String
});
const User = mongoose.model('User', userSchema);

// =====================
// MIDDLEWARE
// =====================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// ✅ FIXED SESSION MIDDLEWARE with MongoStore + TLS
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    mongoOptions: {
      ssl: true,
    },
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    secure: false // change to true if using HTTPS
  }
}));

// =====================
// AUTH MIDDLEWARE
// =====================
function checkAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

// =====================
// ROUTES
// =====================

// Home page
app.get('/', (req, res) => {
  res.render('form');
});

// REGISTER
app.post('/submit', async (req, res) => {
  const { name, email, age, password } = req.body;
  let errors = [];

  if (!name || !email || !age || !password) {
    errors.push("All fields are required.");
  }
  if (age < 18) {
    errors.push("Age must be 18 or above.");
  }
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters.");
  }

  if (errors.length > 0) {
    res.send(`<h3>Validation Errors:</h3><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul><a href="/">Back to Form</a>`);
  } else {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, age, password: hashedPassword });
      await newUser.save();

     res.redirect('/login?message=Registration successful! Please log in.');
    } catch (err) {
      console.error(err);
       res.status(500).send('Error saving user to database or duplicate email.');
    }
  }
});

// REGISTER PAGE
app.get('/register', (req, res) => {
  res.render('form');
});

// LOGIN
app.get('/login', (req, res) => {
  res.render('login', { message: req.query.message || '' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } else {
    res.send('Invalid login. <a href="/login">Try again</a>');
  }
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// DASHBOARD (Protected)
app.get('/dashboard', checkAuth, async (req, res) => {
 try {
    const users = await User.find(); // Fetch all users
    res.render('dashboard', { users }); // Pass to EJS
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});
// Show all users (Protected)
app.get('/users', checkAuth, async (req, res) => {
  const allUsers = await User.find();
  res.json(allUsers);
});

// Result fallback
app.get('/result', (req, res) => {
  res.render('result', { name: '', email: '', age: '' });
});

// =====================
// REST API
// =====================
app.get('/api/users', async (req, res) => {
  const allUsers = await User.find();
  res.json(allUsers);
});

app.post('/api/users', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User added successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});
// DELETE USER (API + Dashboard Support)
app.delete("/delete-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId); // MongoDB delete
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
});
// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
