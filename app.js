const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 600000 }
}));

const loadUsers = () => {
    if (!fs.existsSync('users.json')) {
        fs.writeFileSync('users.json', '[]');
    }
    const data = fs.readFileSync('users.json');
    return JSON.parse(data);
};

const saveUsers = (users) => {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
};

const loadChildren = () => {
    if (!fs.existsSync('children.json')) {
        fs.writeFileSync('children.json', '[]');
    }
    const data = fs.readFileSync('children.json');
    return JSON.parse(data);
};

const saveChildren = (children) => {
    fs.writeFileSync('children.json', JSON.stringify(children, null, 2));
};

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

// Kullanıcı listesi
app.get('/users', (req, res) => {
    const users = loadUsers();
    res.json(users);
});

// Çocuk bilgilerini yükle
app.get('/child-info', (req, res) => {
    const { email } = req.query;
    const children = loadChildren();
    const childInfo = children.find(child => child.email === email) || {};
    res.json(childInfo);
});

// Çocuk bilgilerini güncelle
app.post('/update-child-info', (req, res) => {
    const { email, childName, generalStatus, lessonDate, paymentStatus, artClassTopic } = req.body;
    const children = loadChildren();
    const index = children.findIndex(child => child.email === email);

    if (index !== -1) {
        children[index] = { email, childName, generalStatus, lessonDate, paymentStatus, artClassTopic };
    } else {
        children.push({ email, childName, generalStatus, lessonDate, paymentStatus, artClassTopic });
    }

    saveChildren(children);
    res.sendStatus(200);
});

// Kullanıcı kayıt
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
    const { name, email, phone, childName, password } = req.body;
    const users = loadUsers();

    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.send('Bu email adresi zaten kayıtlı.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ name, email, phone, childName, password: hashedPassword });
    saveUsers(users);

    res.redirect('/login');
});

// Kullanıcı giriş
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();

    const user = users.find(user => user.email === email);
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
        res.json({ isLoggedIn: true });
    } else {
        res.json({ isLoggedIn: false });
    }
});

app.get('/user-info', (req, res) => {
    if (req.session.user) {
        const children = loadChildren();
        const childInfo = children.find(child => child.email === req.session.user.email) || {};
        res.json(childInfo);
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            res.send('Çıkış yaparken bir hata oluştu.');
        } else {
            res.redirect('/');
        }
    });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});