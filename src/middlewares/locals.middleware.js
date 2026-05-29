const { formatPrice, actualPrice } = require('../utils/price');
const prisma = require('../prisma');

module.exports = async function localsMiddleware(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.csrfToken = req.csrfToken();
  res.locals.formatPrice = formatPrice;
  res.locals.actualPrice = actualPrice;
  res.locals.query = req.query || {};
  res.locals.path = req.path;
  try {
    if (req.session.user) {
      const aggregate = await prisma.cartItem.aggregate({
        where: { cart: { userId: req.session.user.id } },
        _sum: { quantity: true }
      });
      res.locals.cartCount = aggregate._sum.quantity || 0;
    } else {
      res.locals.cartCount = (req.session.cart || []).reduce((sum, item) => sum + item.quantity, 0);
    }
    next();
  } catch (err) {
    next(err);
  }
};
