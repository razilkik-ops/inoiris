const prisma = require('../../prisma');
const fs = require('fs');
const path = require('path');
const slugify = require('../../utils/slugify');
const { asArray, validateProduct } = require('../../utils/validators');

async function formData(product = null) {
  const [categories, sizes, colors] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.size.findMany({ orderBy: { name: 'asc' } }),
    prisma.color.findMany({ orderBy: { name: 'asc' } })
  ]);
  return { categories, sizes, colors, product };
}

function productPayload(body) {
  return {
    title: body.title.trim(),
    slug: slugify(body.slug || body.title),
    description: body.description.trim(),
    price: Number(body.price),
    salePrice: body.salePrice ? Number(body.salePrice) : null,
    gender: body.gender,
    ageGroup: body.ageGroup.trim(),
    season: body.season.trim(),
    material: body.material.trim(),
    temperatureRange: body.temperatureRange.trim(),
    categoryId: Number(body.categoryId),
    isActive: body.isActive === 'on',
    isNew: body.isNew === 'on',
    isBestseller: body.isBestseller === 'on'
  };
}

async function replaceVariants(productId, body) {
  const sizeIds = asArray(body.sizeIds).map(Number).filter(Boolean);
  const colorIds = asArray(body.colorIds).map(Number).filter(Boolean);
  const stock = Math.max(0, Number(body.stock) || 0);
  const wanted = new Set(sizeIds.flatMap((sizeId) => colorIds.map((colorId) => `${sizeId}:${colorId}`)));
  for (const sizeId of sizeIds) {
    for (const colorId of colorIds) {
      await prisma.productVariant.upsert({
        where: { productId_sizeId_colorId: { productId, sizeId, colorId } },
        update: { stock },
        create: { productId, sizeId, colorId, stock }
      });
    }
  }
  const existing = await prisma.productVariant.findMany({
    where: { productId },
    include: { _count: { select: { orderItems: true, cartItems: true } } }
  });
  for (const variant of existing) {
    if (wanted.has(`${variant.sizeId}:${variant.colorId}`)) continue;
    if (variant._count.orderItems || variant._count.cartItems) {
      await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: 0 } });
    } else {
      await prisma.productVariant.delete({ where: { id: variant.id } });
    }
  }
}

async function saveImages(productId, files) {
  if (!files?.length) return;
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.createMany({
    data: files.map((file, index) => ({ productId, url: `/uploads/${file.filename}`, isMain: count === 0 && index === 0 }))
  });
}

exports.index = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, images: true, variants: true },
      orderBy: { createdAt: 'desc' }
    });
    res.render('admin/products/index', { layout: 'layouts/admin', title: 'Товары', products });
  } catch (err) {
    next(err);
  }
};

exports.new = async (req, res, next) => {
  try {
    res.render('admin/products/form', { layout: 'layouts/admin', title: 'Новый товар', ...(await formData()) });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validateProduct(req.body);
    if (errors.length) {
      req.flash('error', errors);
      return res.redirect('/admin/products/new');
    }
    const product = await prisma.product.create({ data: productPayload(req.body) });
    await replaceVariants(product.id, req.body);
    await saveImages(product.id, req.files);
    req.flash('success', 'Товар создан.');
    res.redirect('/admin/products');
  } catch (err) {
    if (err.code === 'P2002') req.flash('error', 'Slug уже используется.');
    else req.flash('error', err.message);
    res.redirect('/admin/products/new');
  }
};

exports.edit = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: { images: true, variants: { include: { size: true, color: true } } }
    });
    if (!product) return res.status(404).render('pages/404', { title: 'Товар не найден' });
    res.render('admin/products/form', { layout: 'layouts/admin', title: 'Редактировать товар', ...(await formData(product)) });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const errors = validateProduct(req.body);
    if (errors.length) {
      req.flash('error', errors);
      return res.redirect(`/admin/products/${id}/edit`);
    }
    await prisma.product.update({ where: { id }, data: productPayload(req.body) });
    await replaceVariants(id, req.body);
    await saveImages(id, req.files);
    req.flash('success', 'Товар обновлен.');
    res.redirect('/admin/products');
  } catch (err) {
    req.flash('error', err.code === 'P2002' ? 'Slug уже используется.' : err.message);
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Товар удален.');
    res.redirect('/admin/products');
  } catch (err) {
    req.flash('error', 'Нельзя удалить товар, который уже есть в заказах. Отключите его.');
    res.redirect('/admin/products');
  }
};

exports.uploadImages = async (req, res, next) => {
  try {
    await saveImages(Number(req.params.id), req.files);
    req.flash('success', 'Фото загружены.');
    res.redirect(`/admin/products/${req.params.id}/edit`);
  } catch (err) {
    next(err);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const image = await prisma.productImage.delete({ where: { id: Number(req.params.imageId) } });
    if (image.url.startsWith('/uploads/')) {
      fs.promises.unlink(path.join(__dirname, '..', '..', '..', 'public', image.url)).catch(() => {});
    }
    req.flash('success', 'Фото удалено.');
    res.redirect(req.get('referer') || '/admin/products');
  } catch (err) {
    next(err);
  }
};
