const prisma = require('../../prisma');
const { toNumber } = require('../../utils/price');

exports.index = async (req, res, next) => {
  try {
    const [ordersCount, usersCount, productsCount, sales, latestOrders, lowStock] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
      prisma.order.findMany({ take: 8, orderBy: { createdAt: 'desc' } }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 3 } },
        include: { product: true, size: true, color: true },
        take: 10,
        orderBy: { stock: 'asc' }
      })
    ]);
    res.render('admin/dashboard', {
      layout: 'layouts/admin',
      title: 'Админ-панель',
      stats: { ordersCount, usersCount, productsCount, sales: toNumber(sales._sum.total) },
      latestOrders,
      lowStock
    });
  } catch (err) {
    next(err);
  }
};
