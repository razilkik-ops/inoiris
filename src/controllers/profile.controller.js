const bcrypt = require('bcrypt');
const prisma = require('../prisma');

exports.profile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.user.id } });
    res.render('pages/profile', { title: 'Личный кабинет', user });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!req.body.name || req.body.name.trim().length < 2) {
      req.flash('error', 'Введите имя не короче 2 символов.');
      return res.redirect('/profile');
    }
    const user = await prisma.user.update({
      where: { id: req.session.user.id },
      data: {
        name: req.body.name.trim(),
        phone: req.body.phone?.trim() || null,
        address: req.body.address?.trim() || null
      }
    });
    req.session.user.name = user.name;
    req.flash('success', 'Профиль обновлен.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.orders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({ where: { userId: req.session.user.id }, include: { items: true }, orderBy: { createdAt: 'desc' } });
    res.render('pages/orders', { title: 'Мои заказы', orders });
  } catch (err) {
    next(err);
  }
};

exports.order = async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), userId: req.session.user.id },
      include: { items: true, promoCode: true }
    });
    if (!order) return res.status(404).render('pages/404', { title: 'Заказ не найден' });
    res.render('pages/order-detail', { title: `Заказ №${order.id}`, order });
  } catch (err) {
    next(err);
  }
};

exports.password = async (req, res, next) => {
  try {
    if (String(req.body.newPassword || '').length < 8) {
      req.flash('error', 'Новый пароль должен быть не короче 8 символов.');
      return res.redirect('/profile');
    }
    const user = await prisma.user.findUnique({ where: { id: req.session.user.id } });
    if (!(await bcrypt.compare(String(req.body.currentPassword || ''), user.passwordHash))) {
      req.flash('error', 'Текущий пароль указан неверно.');
      return res.redirect('/profile');
    }
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(req.body.newPassword, 10) } });
    req.flash('success', 'Пароль изменен.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};
