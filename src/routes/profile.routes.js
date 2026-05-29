const router = require('express').Router();
const profile = require('../controllers/profile.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/profile', requireAuth, profile.profile);
router.post('/profile', requireAuth, profile.update);
router.get('/profile/orders', requireAuth, profile.orders);
router.get('/profile/orders/:id', requireAuth, profile.order);
router.post('/profile/password', requireAuth, profile.password);

module.exports = router;
