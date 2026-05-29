const prisma = require('../../prisma');

exports.index = async (req, res, next) => {
  try {
    const where = req.query.status ? { status: req.query.status } : {};
    const orders = await prisma.order.findMany({ where, include: { user: true, items: true }, orderBy: { createdAt: 'desc' } });
    res.render('admin/orders/index', { layout: 'layouts/admin', title: 'Заказы', orders });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) }, include: { user: true, items: true, promoCode: true } });
    if (!order) return res.status(404).render('pages/404', { title: 'Заказ не найден' });
    res.render('admin/orders/show', { layout: 'layouts/admin', title: `Заказ №${order.id}`, order });
  } catch (err) {
    next(err);
  }
};

exports.status = async (req, res, next) => {
  try {
    const status = req.body.status;
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: Number(req.params.id) }, include: { items: true } });
      if (!order) throw new Error('Заказ не найден.');
      const data = { status };
      if (status === 'CANCELLED' && order.stockDeducted) {
        for (const item of order.items) {
          if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
        data.stockDeducted = false;
      }
      if (order.status === 'CANCELLED' && status !== 'CANCELLED' && !order.stockDeducted) {
        for (const item of order.items) {
          if (!item.variantId) continue;
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant || variant.stock < item.quantity) throw new Error(`Недостаточно остатка для ${item.title}.`);
        }
        for (const item of order.items) {
          if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
        }
        data.stockDeducted = true;
      }
      await tx.order.update({ where: { id: order.id }, data });
    });
    req.flash('success', 'Статус заказа обновлен.');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};

exports.paymentStatus = async (req, res, next) => {
  try {
    await prisma.order.update({ where: { id: Number(req.params.id) }, data: { paymentStatus: req.body.paymentStatus } });
    req.flash('success', 'Статус оплаты обновлен.');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    next(err);
  }
};
