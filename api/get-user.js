// api/get-user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Kullanıcı modelinizi uygun şekilde içe aktarın

router.get('/', async (req, res) => {
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

module.exports = router;
