const router = require('express').Router();
const catalog = require('../controllers/catalog.controller');

router.get('/catalog', catalog.catalog);
router.get('/products/:slug', catalog.product);

module.exports = router;
