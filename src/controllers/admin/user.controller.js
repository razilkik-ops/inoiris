const prisma = require('../../prisma');

exports.index = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ include: { _count: { select: { orders: true } } }, orderBy: { createdAt: 'desc' } });
    res.render('admin/users/index', { layout: 'layouts/admin', title: 'Пользователи', users });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, include: { orders: { orderBy: { createdAt: 'desc' } }, favorites: { include: { product: true } } } });
    if (!user) return res.status(404).render('pages/404', { title: 'Пользователь не найден' });
    res.render('admin/users/show', { layout: 'layouts/admin', title: user.email, user });
  } catch (err) {
    next(err);
  }
};

exports.role = async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: Number(req.params.id) }, data: { role: req.body.role } });
    req.flash('success', 'Роль обновлена.');
    res.redirect(`/admin/users/${req.params.id}`);
  } catch (err) {
    next(err);
  }
};

exports.block = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    await prisma.user.update({ where: { id: user.id }, data: { isBlocked: !user.isBlocked } });
    req.flash('success', user.isBlocked ? 'Пользователь разблокирован.' : 'Пользователь заблокирован.');
    res.redirect(`/admin/users/${req.params.id}`);
  } catch (err) {
    next(err);
  }
};
