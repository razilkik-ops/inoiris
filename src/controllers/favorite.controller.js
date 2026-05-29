const prisma = require('../prisma');

exports.index = async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.session.user.id },
      include: { product: { include: { images: true, category: true } } },
      orderBy: { id: 'desc' }
    });
    res.render('pages/favorites', { title: 'Избранное', favorites });
  } catch (err) {
    next(err);
  }
};

exports.add = async (req, res, next) => {
  try {
    await prisma.favorite.upsert({
      where: { userId_productId: { userId: req.session.user.id, productId: Number(req.body.productId) } },
      update: {},
      create: { userId: req.session.user.id, productId: Number(req.body.productId) }
    });
    req.flash('success', 'Товар добавлен в избранное.');
    res.redirect(req.get('referer') || '/favorites');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({ where: { userId: req.session.user.id, productId: Number(req.body.productId) } });
    req.flash('success', 'Товар удален из избранного.');
    res.redirect(req.get('referer') || '/favorites');
  } catch (err) {
    next(err);
  }
};
