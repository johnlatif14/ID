const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));

let users = JSON.parse(fs.readFileSync('data.json'));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '1234') {
    req.session.admin = true;
    return res.redirect('/admin.html');
  }
  res.send('بيانات الدخول غير صحيحة');
});

app.get('/api/user/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.json({ error: 'المستخدم غير موجود' });
  res.json(user);
});

app.post('/api/update', (req, res) => {
  if (!req.session.admin) return res.status(403).json({ message: 'غير مصرح' });
  const { id, category } = req.body;
  const user = users.find(u => u.id === id);
  if (!user) return res.json({ message: 'المستخدم غير موجود' });
  user.category = category;
  fs.writeFileSync('data.json', JSON.stringify(users, null, 2));
  res.json({ message: 'تم التحديث بنجاح' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));