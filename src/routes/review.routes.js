const router = require('express').Router();
const review = require('../controllers/review.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/products/:id/reviews', requireAuth, review.create);

module.exports = router;
