const prisma = require('../prisma');

exports.index = async (req, res, next) => {
  try {
    const [categories, newProducts, bestsellers] = await Promise.all([
      prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } }),
      prisma.product.findMany({ where: { isActive: true, isNew: true }, include: { images: true, category: true }, take: 8, orderBy: { createdAt: 'desc' } }),
      prisma.product.findMany({ where: { isActive: true, isBestseller: true }, include: { images: true, category: true }, take: 8, orderBy: { createdAt: 'desc' } })
    ]);
    res.render('pages/home', { title: 'Теплая зима детям', categories, newProducts, bestsellers });
  } catch (err) {
    next(err);
  }
};
