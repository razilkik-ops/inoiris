const prisma = require('../prisma');
const { actualPrice, discountAmount } = require('./price');

const includeCart = {
  items: {
    include: {
      product: { include: { images: true } },
      variant: { include: { size: true, color: true } }
    },
    orderBy: { id: 'asc' }
  }
};

async function getOrCreateUserCart(userId) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: includeCart
  });
}

async function getCart(req) {
  if (req.session.user) {
    return getOrCreateUserCart(req.session.user.id);
  }
  const items = req.session.cart || [];
  const result = [];
  for (const item of items) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      include: { size: true, color: true, product: { include: { images: true } } }
    });
    if (variant && variant.product.isActive) {
      result.push({
        id: item.variantId,
        productId: variant.productId,
        variantId: variant.id,
        quantity: item.quantity,
        product: variant.product,
        variant
      });
    }
  }
  return { items: result };
}

async function mergeSessionCart(req) {
  if (!req.session.user || !req.session.cart?.length) return;
  const cart = await getOrCreateUserCart(req.session.user.id);
  for (const item of req.session.cart) {
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
      update: { quantity: { increment: item.quantity } },
      create: { cartId: cart.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity }
    });
  }
  req.session.cart = [];
}

function summarizeCart(cart, promoCode) {
  let subtotal = 0;
  const items = cart.items.map((item) => {
    const price = actualPrice(item.product);
    const lineTotal = price * item.quantity;
    subtotal += lineTotal;
    return { ...item, price, lineTotal };
  });
  const discount = discountAmount(subtotal, promoCode);
  return { items, subtotal, discount, total: Math.max(0, subtotal - discount) };
}

async function getPromoFromSession(req) {
  const id = req.session.promoCodeId;
  if (!id) return null;
  const now = new Date();
  const promo = await prisma.promoCode.findFirst({
    where: {
      id,
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now }
    }
  }).catch(() => null);
  if (!promo || (promo.usageLimit && promo.usedCount >= promo.usageLimit)) {
    req.session.promoCodeId = null;
    return null;
  }
  return promo;
}

async function addToCart(req, productId, variantId, quantity) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant || !variant.product.isActive) throw new Error('Товар недоступен.');
  const qty = Math.max(1, Number(quantity) || 1);
  if (qty > variant.stock) throw new Error('Недостаточно товара на складе.');

  if (req.session.user) {
    const cart = await getOrCreateUserCart(req.session.user.id);
    const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
    const nextQty = (existing?.quantity || 0) + qty;
    if (nextQty > variant.stock) throw new Error('В корзине уже максимальное доступное количество.');
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: nextQty },
      create: { cartId: cart.id, productId, variantId, quantity: qty }
    });
  } else {
    req.session.cart = req.session.cart || [];
    const existing = req.session.cart.find((item) => item.variantId === variantId);
    const nextQty = (existing?.quantity || 0) + qty;
    if (nextQty > variant.stock) throw new Error('В корзине уже максимальное доступное количество.');
    if (existing) existing.quantity = nextQty;
    else req.session.cart.push({ productId, variantId, quantity: qty });
  }
}

async function clearCart(req) {
  if (req.session.user) {
    const cart = await getOrCreateUserCart(req.session.user.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  } else {
    req.session.cart = [];
  }
  req.session.promoCodeId = null;
}

module.exports = { getCart, summarizeCart, addToCart, clearCart, mergeSessionCart, getPromoFromSession, getOrCreateUserCart };
