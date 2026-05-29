const prisma = require('../prisma');
const { asArray } = require('../utils/validators');

function productInclude() {
  return { images: true, category: true, variants: { include: { size: true, color: true } }, reviews: { where: { isVisible: true } } };
}

exports.catalog = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const take = 9;
    const where = { isActive: true };
    if (req.query.q) where.title = { contains: req.query.q, mode: 'insensitive' };
    if (req.query.category) where.categoryId = Number(req.query.category);
    if (req.query.gender) where.gender = req.query.gender;
    if (req.query.ageGroup) where.ageGroup = { contains: req.query.ageGroup, mode: 'insensitive' };
    if (req.query.season) where.season = { contains: req.query.season, mode: 'insensitive' };
    if (req.query.temperatureRange) where.temperatureRange = { contains: req.query.temperatureRange, mode: 'insensitive' };
    if (req.query.minPrice || req.query.maxPrice) {
      where.price = {};
      if (req.query.minPrice) where.price.gte = Number(req.query.minPrice);
      if (req.query.maxPrice) where.price.lte = Number(req.query.maxPrice);
    }
    const sizeIds = asArray(req.query.size).map(Number).filter(Boolean);
    const colorIds = asArray(req.query.color).map(Number).filter(Boolean);
    if (sizeIds.length || colorIds.length) {
      where.variants = { some: { ...(sizeIds.length ? { sizeId: { in: sizeIds } } : {}), ...(colorIds.length ? { colorId: { in: colorIds } } : {}) } };
    }

    const orderBy = req.query.sort === 'price_asc' ? { price: 'asc' }
      : req.query.sort === 'price_desc' ? { price: 'desc' }
      : req.query.sort === 'popular' ? { orderItems: { _count: 'desc' } }
      : { createdAt: 'desc' };

    const [products, total, categories, sizes, colors] = await Promise.all([
      prisma.product.findMany({ where, include: productInclude(), orderBy, skip: (page - 1) * take, take }),
      prisma.product.count({ where }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.size.findMany({ orderBy: { name: 'asc' } }),
      prisma.color.findMany({ orderBy: { name: 'asc' } })
    ]);

    res.render('pages/catalog', { title: 'Каталог', products, total, page, pages: Math.ceil(total / take), categories, sizes, colors });
  } catch (err) {
    next(err);
  }
};

exports.product = async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: {
        ...productInclude(),
        reviews: { where: { isVisible: true }, include: { user: true }, orderBy: { createdAt: 'desc' } }
      }
    });
    if (!product) return res.status(404).render('pages/404', { title: 'Товар не найден' });
    const related = await prisma.product.findMany({
      where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
      include: { images: true, category: true },
      take: 4
    });
    res.render('pages/product', { title: product.title, product, related });
  } catch (err) {
    next(err);
  }
};
