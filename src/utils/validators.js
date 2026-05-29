function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function validateUser(body, { passwordRequired = false } = {}) {
  const errors = [];
  if (!required(body.name) || body.name.trim().length < 2) errors.push('Введите имя не короче 2 символов.');
  if (!isEmail(body.email)) errors.push('Введите корректный email.');
  if (passwordRequired && String(body.password || '').length < 8) errors.push('Пароль должен быть не короче 8 символов.');
  return errors;
}

function validateProduct(body) {
  const errors = [];
  if (!required(body.title)) errors.push('Введите название товара.');
  if (!required(body.description)) errors.push('Введите описание товара.');
  if (!Number(body.price) || Number(body.price) <= 0) errors.push('Цена должна быть больше 0.');
  if (body.salePrice && Number(body.salePrice) >= Number(body.price)) errors.push('Скидочная цена должна быть меньше обычной.');
  if (!required(body.categoryId)) errors.push('Выберите категорию.');
  if (!required(body.gender)) errors.push('Выберите пол.');
  if (!required(body.ageGroup)) errors.push('Введите возрастную группу.');
  if (!required(body.season)) errors.push('Введите сезон.');
  if (!required(body.material)) errors.push('Введите состав материала.');
  if (!required(body.temperatureRange)) errors.push('Введите температурный режим.');
  if (!asArray(body.sizeIds).length) errors.push('Выберите хотя бы один размер.');
  if (!asArray(body.colorIds).length) errors.push('Выберите хотя бы один цвет.');
  if (Number(body.stock) < 0) errors.push('Остаток не может быть отрицательным.');
  return errors;
}

function validateCheckout(body) {
  const errors = [];
  if (!required(body.customerName)) errors.push('Введите имя.');
  if (!isEmail(body.customerEmail)) errors.push('Введите корректный email.');
  if (!required(body.customerPhone)) errors.push('Введите телефон.');
  if (!required(body.city)) errors.push('Введите город.');
  if (!required(body.address)) errors.push('Введите адрес.');
  if (!required(body.deliveryMethod)) errors.push('Выберите способ доставки.');
  if (!required(body.paymentMethod)) errors.push('Выберите способ оплаты.');
  return errors;
}

module.exports = { required, isEmail, asArray, validateUser, validateProduct, validateCheckout };
