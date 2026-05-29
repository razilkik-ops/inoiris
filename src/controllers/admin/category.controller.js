const prisma = require('../../prisma');
const slugify = require('../../utils/slugify');

exports.index = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ include: { parent: true, _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
    res.render('admin/categories/index', { layout: 'layouts/admin', title: 'Категории', categories });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.body.name) throw new Error('Введите название категории.');
    await prisma.category.create({ data: { name: req.body.name.trim(), slug: slugify(req.body.slug || req.body.name), parentId: req.body.parentId ? Number(req.body.parentId) : null } });
    req.flash('success', 'Категория создана.');
  } catch (err) {
    req.flash('error', err.code === 'P2002' ? 'Slug уже используется.' : err.message);
  }
  res.redirect('/admin/categories');
};

exports.edit = async (req, res, next) => {
  try {
    const [category, categories] = await Promise.all([
      prisma.category.findUnique({ where: { id: Number(req.params.id) } }),
      prisma.category.findMany({ orderBy: { name: 'asc' } })
    ]);
    if (!category) return res.status(404).render('pages/404', { title: 'Категория не найдена' });
    res.render('admin/categories/form', { layout: 'layouts/admin', title: 'Редактировать категорию', category, categories });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res) => {
  try {
    await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: { name: req.body.name.trim(), slug: slugify(req.body.slug || req.body.name), parentId: req.body.parentId ? Number(req.body.parentId) : null }
    });
    req.flash('success', 'Категория обновлена.');
    res.redirect('/admin/categories');
  } catch (err) {
    req.flash('error', err.code === 'P2002' ? 'Slug уже используется.' : err.message);
    res.redirect(`/admin/categories/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Категория удалена.');
  } catch (err) {
    req.flash('error', 'Нельзя удалить категорию с товарами или дочерними категориями.');
  }
  res.redirect('/admin/categories');
};
