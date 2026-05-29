const bcrypt = require('bcrypt');
const prisma = require('../prisma');
const { validateUser } = require('../utils/validators');
const { mergeSessionCart } = require('../utils/cart');

exports.loginForm = (req, res) => res.render('pages/login', { title: 'Вход' });
exports.registerForm = (req, res) => res.render('pages/register', { title: 'Регистрация' });

exports.register = async (req, res, next) => {
  try {
    const errors = validateUser(req.body, { passwordRequired: true });
    if (errors.length) {
      req.flash('error', errors);
      return res.redirect('/register');
    }
    const email = req.body.email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      req.flash('error', 'Пользователь с таким email уже существует.');
      return res.redirect('/register');
    }
    const user = await prisma.user.create({
      data: {
        email,
        name: req.body.name.trim(),
        phone: req.body.phone?.trim() || null,
        passwordHash: await bcrypt.hash(req.body.password, 10)
      }
    });
    req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    await mergeSessionCart(req);
    req.flash('success', 'Регистрация завершена.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
      req.flash('error', 'Неверный email или пароль.');
      return res.redirect('/login');
    }
    if (user.isBlocked) {
      req.flash('error', 'Аккаунт заблокирован.');
      return res.redirect('/login');
    }
    req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    await mergeSessionCart(req);
    req.flash('success', 'Вы вошли в аккаунт.');
    res.redirect(user.role === 'ADMIN' ? '/admin' : '/profile');
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
};
