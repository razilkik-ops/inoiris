const prisma = require('../prisma');
const { getCart, summarizeCart, clearCart, getPromoFromSession } = require('../utils/cart');
const { validateCheckout } = require('../utils/validators');

exports.form = async (req, res, next) => {
  try {
    const promoCode = await getPromoFromSession(req);
    const summary = summarizeCart(await getCart(req), promoCode);
    if (!summary.items.length) {
      req.flash('error', 'Корзина пуста.');
      return res.redirect('/cart');
    }
    const buyer = req.session.user ? await prisma.user.findUnique({ where: { id: req.session.user.id } }) : null;
    res.render('pages/checkout', { title: 'Оформление заказа', summary, promoCode, buyer });
  } catch (err) {
    next(err);
  }
};

exports.submit = async (req, res, next) => {
  try {
    const errors = validateCheckout(req.body);
    if (errors.length) {
      req.flash('error', errors);
      return res.redirect('/checkout');
    }
    const promoCode = await getPromoFromSession(req);
    const summary = summarizeCart(await getCart(req), promoCode);
    if (!summary.items.length) {
      req.flash('error', 'Корзина пуста.');
      return res.redirect('/cart');
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of summary.items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant || variant.stock < item.quantity) throw new Error(`Недостаточно товара: ${item.product.title}`);
      }
      for (const item of summary.items) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
      }
      if (promoCode) await tx.promoCode.update({ where: { id: promoCode.id }, data: { usedCount: { increment: 1 } } });
      return tx.order.create({
        data: {
          userId: req.session.user?.id || null,
          customerName: req.body.customerName.trim(),
          customerEmail: req.body.customerEmail.trim(),
          customerPhone: req.body.customerPhone.trim(),
          city: req.body.city.trim(),
          address: req.body.address.trim(),
          deliveryMethod: req.body.deliveryMethod,
          paymentMethod: req.body.paymentMethod,
          paymentStatus: req.body.paymentMethod === 'ONLINE' ? 'PENDING' : 'PENDING',
          subtotal: summary.subtotal,
          discount: summary.discount,
          total: summary.total,
          promoCodeId: promoCode?.id || null,
          comment: req.body.comment?.trim() || null,
          items: {
            create: summary.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.product.title,
              price: item.price,
              quantity: item.quantity,
              sizeName: item.variant.size.name,
              colorName: item.variant.color.name
            }))
          }
        }
      });
    });

    await clearCart(req);
    req.flash('success', `Заказ №${order.id} создан.`);
    res.redirect(`/checkout/success/${order.id}`);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/checkout');
  }
};

exports.success = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order) return res.status(404).render('pages/404', { title: 'Заказ не найден' });
    res.render('pages/checkout-success', { title: 'Заказ оформлен', order });
  } catch (err) {
    next(err);
  }
};
