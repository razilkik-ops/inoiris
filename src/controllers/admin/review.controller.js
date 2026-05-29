const prisma = require('../../prisma');

exports.index = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({ include: { user: true, product: true }, orderBy: { createdAt: 'desc' } });
    res.render('admin/reviews/index', { layout: 'layouts/admin', title: 'Отзывы', reviews });
  } catch (err) {
    next(err);
  }
};

exports.toggle = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: Number(req.params.id) } });
    await prisma.review.update({ where: { id: review.id }, data: { isVisible: !review.isVisible } });
    req.flash('success', 'Видимость отзыва обновлена.');
    res.redirect('/admin/reviews');
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await prisma.review.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Отзыв удален.');
    res.redirect('/admin/reviews');
  } catch (err) {
    next(err);
  }
};
