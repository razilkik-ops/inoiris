const prisma = require('../../prisma');

function payload(body) {
  return {
    code: String(body.code || '').trim().toUpperCase(),
    type: body.type,
    value: Number(body.value),
    startsAt: new Date(body.startsAt),
    endsAt: new Date(body.endsAt),
    usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
    isActive: body.isActive === 'on'
  };
}

function validate(body) {
  const errors = [];
  if (!body.code) errors.push('Введите код.');
  if (!['PERCENT', 'FIXED'].includes(body.type)) errors.push('Выберите тип скидки.');
  if (!Number(body.value) || Number(body.value) <= 0) errors.push('Скидка должна быть больше 0.');
  if (!body.startsAt || !body.endsAt || new Date(body.startsAt) > new Date(body.endsAt)) errors.push('Проверьте даты действия.');
  return errors;
}

exports.index = async (req, res, next) => {
  try {
    const promocodes = await prisma.promoCode.findMany({ orderBy: { id: 'desc' } });
    res.render('admin/promocodes/index', { layout: 'layouts/admin', title: 'Промокоды', promocodes });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validate(req.body);
    if (errors.length) throw new Error(errors.join(' '));
    await prisma.promoCode.create({ data: payload(req.body) });
    req.flash('success', 'Промокод создан.');
  } catch (err) {
    req.flash('error', err.code === 'P2002' ? 'Такой промокод уже есть.' : err.message);
  }
  res.redirect('/admin/promocodes');
};

exports.edit = async (req, res, next) => {
  try {
    const promo = await prisma.promoCode.findUnique({ where: { id: Number(req.params.id) } });
    if (!promo) return res.status(404).render('pages/404', { title: 'Промокод не найден' });
    res.render('admin/promocodes/form', { layout: 'layouts/admin', title: 'Редактировать промокод', promo });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validate(req.body);
    if (errors.length) throw new Error(errors.join(' '));
    await prisma.promoCode.update({ where: { id: Number(req.params.id) }, data: payload(req.body) });
    req.flash('success', 'Промокод обновлен.');
    res.redirect('/admin/promocodes');
  } catch (err) {
    req.flash('error', err.code === 'P2002' ? 'Такой промокод уже есть.' : err.message);
    res.redirect(`/admin/promocodes/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    await prisma.promoCode.delete({ where: { id: Number(req.params.id) } });
    req.flash('success', 'Промокод удален.');
  } catch (err) {
    req.flash('error', 'Нельзя удалить промокод, который использовался в заказах. Отключите его.');
  }
  res.redirect('/admin/promocodes');
};
