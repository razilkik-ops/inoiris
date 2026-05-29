const router = require('express').Router();
const cart = require('../controllers/cart.controller');

router.get('/cart', cart.show);
router.post('/cart/add', cart.add);
router.post('/cart/update', cart.update);
router.post('/cart/remove', cart.remove);
router.post('/cart/clear', cart.clear);
router.post('/cart/promocode', cart.promocode);

module.exports = router;
