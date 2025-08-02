const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 ساعة
}));

// تحميل بيانات المستخدمين
let users = [];
try {
  users = JSON.parse(fs.readFileSync('data.json'));
} catch (err) {
  console.error('Error loading data file, starting with empty array');
  users = [];
}

// حفظ البيانات إلى الملف
function saveData() {
  fs.writeFileSync('data.json', JSON.stringify(users, null, 2));
}

// Routes

// تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'john' && password === 'latif') {
    req.session.admin = true;
    return res.redirect('/admin.html');
  }
  res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
});

// تسجيل الخروج
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Middleware للتحقق من صلاحية الأدمن
function checkAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(403).json({ message: 'غير مصرح بالوصول' });
  }
  next();
}

// الحصول على جميع المستخدمين
app.get('/api/users', checkAdmin, (req, res) => {
  res.json(users);
});

// البحث عن مستخدم
app.get('/api/users/search', checkAdmin, (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(users);
  
  const filteredUsers = users.filter(user => 
    user.id.includes(q) || 
    user.name.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json(filteredUsers);
});

// الحصول على مستخدم بواسطة ID
app.get('/api/users/:id', checkAdmin, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
  res.json(user);
});

// إضافة مستخدم جديد
app.post('/api/users', checkAdmin, (req, res) => {
  const { id, name, rating, category } = req.body;
  
  if (!id || !name || !category) {
    return res.status(400).json({ message: 'جميع الحقول مطلوبة ما عدا التقييم' });
  }
  
  if (users.some(u => u.id === id)) {
    return res.status(400).json({ message: 'رقم ID موجود مسبقاً' });
  }
  
  const newUser = {
    id,
    name,
    rating: rating || '0.0',
    category
  };
  
  users.push(newUser);
  saveData();
  res.json({ message: 'تمت إضافة المستخدم بنجاح', user: newUser });
});

// تحديث مستخدم
app.put('/api/users/:id', checkAdmin, (req, res) => {
  const { id } = req.params;
  const { name, rating, category } = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }
  
  if (name) users[userIndex].name = name;
  if (rating) users[userIndex].rating = rating;
  if (category) users[userIndex].category = category;
  
  saveData();
  res.json({ message: 'تم تحديث المستخدم بنجاح', user: users[userIndex] });
});

// حذف مستخدم
app.delete('/api/users/:id', checkAdmin, (req, res) => {
  const { id } = req.params;
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  saveData();
  res.json({ message: 'تم حذف المستخدم بنجاح', user: deletedUser });
});

// Route لحماية الصفحات الإدارية
app.get('/admin.html', checkAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/login.html`);
});