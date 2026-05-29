const router = require('express').Router();
const requireAdmin = require('../middlewares/admin.middleware');
const upload = require('../middlewares/upload.middleware');

const dashboard = require('../controllers/admin/dashboard.controller');
const products = require('../controllers/admin/product.controller');
const categories = require('../controllers/admin/category.controller');
const orders = require('../controllers/admin/order.controller');
const users = require('../controllers/admin/user.controller');
const reviews = require('../controllers/admin/review.controller');
const promocodes = require('../controllers/admin/promocode.controller');

router.use(requireAdmin);

router.get('/', dashboard.index);

router.get('/products', products.index);
router.get('/products/new', products.new);
router.post('/products', upload.array('images', 8), products.create);
router.get('/products/:id/edit', products.edit);
router.post('/products/:id', upload.array('images', 8), products.update);
router.post('/products/:id/delete', products.delete);
router.post('/products/:id/images', upload.array('images', 8), products.uploadImages);
router.post('/products/images/:imageId/delete', products.deleteImage);

router.get('/categories', categories.index);
router.post('/categories', categories.create);
router.get('/categories/:id/edit', categories.edit);
router.post('/categories/:id', categories.update);
router.post('/categories/:id/delete', categories.delete);

router.get('/orders', orders.index);
router.get('/orders/:id', orders.show);
router.post('/orders/:id/status', orders.status);
router.post('/orders/:id/payment-status', orders.paymentStatus);

router.get('/users', users.index);
router.get('/users/:id', users.show);
router.post('/users/:id/role', users.role);
router.post('/users/:id/block', users.block);

router.get('/reviews', reviews.index);
router.post('/reviews/:id/toggle', reviews.toggle);
router.post('/reviews/:id/delete', reviews.delete);

router.get('/promocodes', promocodes.index);
router.post('/promocodes', promocodes.create);
router.get('/promocodes/:id/edit', promocodes.edit);
router.post('/promocodes/:id', promocodes.update);
router.post('/promocodes/:id/delete', promocodes.delete);

module.exports = router;
