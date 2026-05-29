const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const colors = [
  ['Синий', '#2563eb'],
  ['Розовый', '#f472b6'],
  ['Красный', '#ef4444'],
  ['Черный', '#111827'],
  ['Белый', '#f8fafc'],
  ['Серый', '#94a3b8'],
  ['Зеленый', '#16a34a']
];

const categories = ['Комбинезоны', 'Куртки', 'Полукомбинезоны', 'Шапки', 'Варежки', 'Термобелье', 'Обувь'];
const sizes = ['80', '86', '92', '98', '104', '110', '116', '122', '128', '134', '140'];

function slugify(text) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
  return text.toLowerCase().split('').map((ch) => map[ch] ?? ch).join('').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function makeSvg(file, title, bg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><rect width="900" height="900" fill="${bg}"/><circle cx="650" cy="170" r="120" fill="rgba(255,255,255,.28)"/><path d="M225 300c45-82 126-124 236-124 108 0 188 42 234 124l-72 74v300c0 38-31 69-69 69H368c-38 0-69-31-69-69V374l-74-74z" fill="rgba(255,255,255,.8)"/><text x="450" y="790" fill="#0f172a" font-family="Arial" font-size="38" font-weight="700" text-anchor="middle">${title}</text></svg>`;
  fs.writeFileSync(file, svg);
}

async function main() {
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  fs.mkdirSync(uploadDir, { recursive: true });

  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.size.deleteMany();
  await prisma.color.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash('admin123456', 10),
    bcrypt.hash('user123456', 10)
  ]);

  await prisma.user.createMany({
    data: [
      { email: 'admin@shop.test', passwordHash: adminHash, name: 'Администратор', role: 'ADMIN', phone: '+375291111111' },
      { email: 'user@shop.test', passwordHash: userHash, name: 'Тестовый покупатель', role: 'USER', phone: '+375292222222', address: 'Минск, пр-т Независимости, 1' }
    ]
  });

  const categoryRows = {};
  for (const name of categories) {
    categoryRows[name] = await prisma.category.create({ data: { name, slug: slugify(name) } });
  }

  const sizeRows = {};
  for (const name of sizes) sizeRows[name] = await prisma.size.create({ data: { name } });

  const colorRows = {};
  for (const [name, hex] of colors) colorRows[name] = await prisma.color.create({ data: { name, hex } });

  const products = [
    ['Комбинезон Arctic Kids', 'Комбинезоны', 189.9, 159.9, 'UNISEX', '1-3 года', 'Зима', 'мембрана, утеплитель 250 г', 'от -5 до -25', true, true, ['80','86','92'], ['Синий','Красный']],
    ['Куртка Snow Patrol', 'Куртки', 139.5, null, 'BOYS', '4-7 лет', 'Зима', 'полиэстер, флис', 'от -5 до -20', true, false, ['104','110','116'], ['Синий','Черный']],
    ['Парка Pink Frost', 'Куртки', 149.0, 129.0, 'GIRLS', '4-7 лет', 'Зима', 'мембрана, искусственный пух', 'от -10 до -25', false, true, ['104','110','116'], ['Розовый','Белый']],
    ['Полукомбинезон Nord', 'Полукомбинезоны', 95.0, null, 'UNISEX', '3-6 лет', 'Зима', 'оксфорд, синтепон', 'от 0 до -20', false, false, ['98','104','110'], ['Серый','Черный']],
    ['Шапка Warm Bear', 'Шапки', 24.9, 19.9, 'UNISEX', '2-8 лет', 'Зима', 'шерсть 50%, акрил 50%', 'до -20', true, true, ['98','110','122'], ['Серый','Зеленый']],
    ['Варежки Ice Fun', 'Варежки', 18.5, null, 'UNISEX', '2-7 лет', 'Зима', 'полиэстер, флис', 'до -18', false, false, ['92','104','116'], ['Красный','Синий']],
    ['Термокомплект Soft Layer', 'Термобелье', 59.9, 49.9, 'UNISEX', '3-10 лет', 'Зима', 'полиэстер, эластан', 'базовый слой', true, false, ['98','110','122','134'], ['Черный','Серый']],
    ['Сапоги Snow Step', 'Обувь', 79.9, null, 'BOYS', '4-9 лет', 'Зима', 'эва, шерстяной вкладыш', 'до -25', true, true, ['104','116','128'], ['Черный','Синий']],
    ['Комбинезон Berry Wind', 'Комбинезоны', 199.0, 169.0, 'GIRLS', '1-4 года', 'Зима', 'мембрана, изософт', 'от -5 до -30', true, false, ['80','86','92','98'], ['Розовый','Красный']],
    ['Куртка Forest Trail', 'Куртки', 132.0, null, 'UNISEX', '6-10 лет', 'Зима', 'мембрана, флис', 'от -5 до -22', false, false, ['116','122','128','134'], ['Зеленый','Серый']],
    ['Шлем Cozy Head', 'Шапки', 29.0, null, 'UNISEX', '1-5 лет', 'Зима', 'хлопок, шерсть', 'до -20', true, false, ['80','92','104'], ['Белый','Серый']],
    ['Ботинки Polar Walk', 'Обувь', 89.0, 75.0, 'GIRLS', '5-10 лет', 'Зима', 'текстиль, термоподкладка', 'до -25', true, true, ['110','122','134','140'], ['Розовый','Черный']]
  ];

  const palette = ['#dbeafe', '#fce7f3', '#fee2e2', '#e5e7eb', '#dcfce7', '#fef3c7'];
  for (let i = 0; i < products.length; i++) {
    const [title, category, price, salePrice, gender, ageGroup, season, material, temperatureRange, isNew, isBestseller, pSizes, pColors] = products[i];
    const product = await prisma.product.create({
      data: {
        title,
        slug: slugify(title),
        description: `${title} создан для активных зимних прогулок: хорошо держит тепло, не сковывает движения и легко сочетается с другой одеждой.`,
        price,
        salePrice,
        gender,
        ageGroup,
        season,
        material,
        temperatureRange,
        isNew,
        isBestseller,
        categoryId: categoryRows[category].id
      }
    });
    const fileName = `seed-product-${i + 1}.svg`;
    makeSvg(path.join(uploadDir, fileName), title, palette[i % palette.length]);
    await prisma.productImage.create({ data: { productId: product.id, url: `/uploads/${fileName}`, isMain: true } });
    for (const size of pSizes) {
      for (const color of pColors) {
        await prisma.productVariant.create({
          data: { productId: product.id, sizeId: sizeRows[size].id, colorId: colorRows[color].id, stock: 3 + ((i + size.length + color.length) % 8) }
        });
      }
    }
  }

  await prisma.promoCode.createMany({
    data: [
      { code: 'WINTER10', type: 'PERCENT', value: 10, startsAt: new Date('2025-01-01'), endsAt: new Date('2027-12-31'), usageLimit: 100, isActive: true },
      { code: 'SNOW15', type: 'FIXED', value: 15, startsAt: new Date('2025-01-01'), endsAt: new Date('2027-12-31'), usageLimit: 50, isActive: true }
    ]
  });

  console.log('Seed completed');
}

main().finally(async () => prisma.$disconnect());
