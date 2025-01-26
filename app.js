const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose'); // mongoose modülünü ekleyin
const config = require('./config'); // config.js dosyasını oluşturduğunuzu varsayıyorum

const app = express();
const port = 3001;

// Middleware ayarları
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 600000 }
}));

// MongoDB'ye bağlantı kuruyoruz
mongoose.connect(config.url)
    .then(() => console.log("MongoDB'ye başarıyla bağlanıldı!"))
    .catch((err) => console.log("MongoDB bağlantısı hatası:", err));

// Kullanıcı şeması
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    phone: String,
    childName: String,
    generalStatus: String,
    lessonDate: String,
    paymentStatus: String,
    artClassTopic: String
});

const User = mongoose.model('User', userSchema);

// Admin login
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_login.html'));
});

app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    const adminUsername = 'admin';
    const adminPassword = 'admin123';

    if (username === adminUsername && password === adminPassword) {
        req.session.isAdmin = true;
        res.redirect('/admin-panel');
    } else {
        res.status(401).send('Geçersiz kullanıcı adı veya şifre');
    }
});

// Admin panel
app.get('/admin-panel', (req, res) => {
    if (req.session.isAdmin) {
        res.sendFile(path.join(__dirname, 'public', 'admin_panel.html'));
    } else {
        res.redirect('/admin-login');
    }
});

// Kullanıcı kayıt
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
    const { name, email, phone, childName, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.send('Bu email adresi zaten kayıtlı.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, childName, password: hashedPassword });
    await newUser.save();

    res.redirect('/login');
});

// Kullanıcı bilgilerini alma
app.get('/get-user', async (req, res) => {
    const { email } = req.query;
    try {
        const user = await User.findOne({ email });
        res.json(user);
    } catch (err) {
        res.status(500).send("Kullanıcı bilgilerini getirme hatası!");
    }
});

// Kullanıcı giriş
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/secret');
    } else {
        res.send('Geçersiz email veya şifre');
    }
});

// Gizli sayfa
app.get('/secret', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'secret.html'));
    } else {
        res.send('Bu sayfaya erişmek için giriş yapmalısınız.');
    }
});

app.get('/check-login', (req, res) => {
    if (req.session.user) {
        res.json({ isLoggedIn: true, user: req.session.user });
    } else {
        res.json({ isLoggedIn: false });
    }
});

app.get('/get-user', async (req, res) => {
    const { email } = req.query;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("Kullanıcı bulunamadı.");
        }
        res.json(user);
    } catch (err) {
        res.status(500).send("Kullanıcı bilgilerini getirme hatası!");
    }
});

// Kullanıcıları görüntüleme
app.get('/get-users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send("Veritabanından kullanıcıları getirme hatası!");
    }
});

// Kullanıcı güncelleme
app.post('/update-user', async (req, res) => {
    const { email, name, phone, childName, generalStatus, lessonDate, paymentStatus, artClassTopic } = req.body;

    try {
        const result = await User.updateOne(
            { email },
            { name, phone, childName, generalStatus, lessonDate, paymentStatus, artClassTopic }
        );

        if (result.nModified === 0) {
            return res.status(404).send("Kullanıcı bulunamadı veya güncellenmedi.");
        }

        res.send("Kullanıcı başarıyla güncellendi!");
    } catch (err) {
        console.error("Güncelleme hatası:", err);
        res.status(500).send("Bir hata oluştu!");
    }
});

// Kullanıcı silme
app.delete('/delete-user', async (req, res) => {
    const { email } = req.query;

    try {
        const result = await User.deleteOne({ email });

        if (result.deletedCount === 0) {
            return res.status(404).send("Kullanıcı bulunamadı.");
        }

        res.send("Kullanıcı başarıyla silindi!");
    } catch (err) {
        console.error("Silme hatası:", err);
        res.status(500).send("Bir hata oluştu!");
    }
});

// Kullanıcı çıkışı
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.send('Çıkış yaparken bir hata oluştu.');
        } else {
            res.redirect('/');
        }
    });
});

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});