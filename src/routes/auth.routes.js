const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const { redirectIfAuth } = require('../middlewares/auth.middleware');

router.get('/login', redirectIfAuth, auth.loginForm);
router.post('/login', redirectIfAuth, auth.login);
router.get('/register', redirectIfAuth, auth.registerForm);
router.post('/register', redirectIfAuth, auth.register);
router.post('/logout', auth.logout);

module.exports = router;
