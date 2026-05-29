const router = require('express').Router();
const checkout = require('../controllers/checkout.controller');

router.get('/checkout', checkout.form);
router.post('/checkout', checkout.submit);
router.get('/checkout/success/:id', checkout.success);

module.exports = router;
