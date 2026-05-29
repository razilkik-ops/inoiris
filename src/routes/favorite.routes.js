const router = require('express').Router();
const favorite = require('../controllers/favorite.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.get('/favorites', requireAuth, favorite.index);
router.post('/favorites/add', requireAuth, favorite.add);
router.post('/favorites/remove', requireAuth, favorite.remove);

module.exports = router;
