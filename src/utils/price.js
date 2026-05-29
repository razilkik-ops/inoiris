function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function actualPrice(product) {
  const price = toNumber(product.price);
  const salePrice = toNumber(product.salePrice);
  return salePrice > 0 && salePrice < price ? salePrice : price;
}

function formatPrice(value) {
  return `${toNumber(value).toFixed(2)} BYN`;
}

function discountAmount(subtotal, promoCode) {
  if (!promoCode) return 0;
  const base = toNumber(subtotal);
  const value = toNumber(promoCode.value);
  if (promoCode.type === 'PERCENT') return Math.min(base, base * value / 100);
  return Math.min(base, value);
}

module.exports = { toNumber, actualPrice, formatPrice, discountAmount };
