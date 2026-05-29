const prisma = require('../prisma');
const { getCart, summarizeCart, addToCart, clearCart, getPromoFromSession, getOrCreateUserCart } = require('../utils/cart');

exports.show = async (req, res, next) => {
  try {
    const promoCode = await getPromoFromSession(req);
    const summary = summarizeCart(await getCart(req), promoCode);
    const cartProductIds = summary.items.map((item) => item.productId || item.product.id).filter(Boolean);
    const recommendationWhere = {
      isActive: true,
      variants: { some: { stock: { gt: 0 } } },
      ...(cartProductIds.length ? { id: { notIn: cartProductIds } } : {})
    };
    const recommendations = await prisma.product.findMany({
      where: recommendationWhere,
      include: {
        images: true,
        variants: {
          where: { stock: { gt: 0 } },
          include: { size: true, color: true },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    res.render('pages/cart', { title: 'Корзина', summary, promoCode, recommendations });
  } catch (err) {
    next(err);
  }
};

exports.add = async (req, res) => {
  try {
    await addToCart(req, Number(req.body.productId), Number(req.body.variantId), Number(req.body.quantity));
    req.flash('success', 'Товар добавлен в корзину.');
  } catch (err) {
    req.flash('error', err.message);
  }
  res.redirect(req.get('referer') || '/cart');
};

exports.update = async (req, res, next) => {
  try {
    const variantId = Number(req.body.variantId);
    const quantity = Math.max(1, Number(req.body.quantity) || 1);
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || quantity > variant.stock) {
      req.flash('error', 'Недостаточно товара на складе.');
      return res.redirect('/cart');
    }
    if (req.session.user) {
      const cart = await getOrCreateUserCart(req.session.user.id);
      await prisma.cartItem.update({ where: { cartId_variantId: { cartId: cart.id, variantId } }, data: { quantity } });
    } else {
      const item = (req.session.cart || []).find((row) => row.variantId === variantId);
      if (item) item.quantity = quantity;
    }
    req.flash('success', 'Корзина обновлена.');
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const variantId = Number(req.body.variantId);
    if (req.session.user) {
      const cart = await getOrCreateUserCart(req.session.user.id);
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
    } else {
      req.session.cart = (req.session.cart || []).filter((item) => item.variantId !== variantId);
    }
    req.flash('success', 'Товар удален.');
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};

exports.clear = async (req, res, next) => {
  try {
    await clearCart(req);
    req.flash('success', 'Корзина очищена.');
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};

exports.promocode = async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const now = new Date();
    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo || !promo.isActive || promo.startsAt > now || promo.endsAt < now || (promo.usageLimit && promo.usedCount >= promo.usageLimit)) {
      req.session.promoCodeId = null;
      req.flash('error', 'Промокод недействителен.');
    } else {
      req.session.promoCodeId = promo.id;
      req.flash('success', 'Промокод применен.');
    }
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};
