const prisma = require('../prisma');

exports.create = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    const text = String(req.body.text || '').trim();
    const productId = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).render('pages/404', { title: 'Товар не найден' });
    if (rating < 1 || rating > 5 || text.length < 5) {
      req.flash('error', 'Оценка должна быть от 1 до 5, текст отзыва — от 5 символов.');
      return res.redirect(`/products/${product.slug}`);
    }
    await prisma.review.create({ data: { userId: req.session.user.id, productId, rating, text } });
    req.flash('success', 'Отзыв опубликован.');
    res.redirect(`/products/${product.slug}`);
  } catch (err) {
    next(err);
  }
};
