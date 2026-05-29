const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const methodOverride = require('method-override');
const csrf = require('csurf');

const localsMiddleware = require('./middlewares/locals.middleware');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const catalogRoutes = require('./routes/catalog.routes');
const cartRoutes = require('./routes/cart.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const profileRoutes = require('./routes/profile.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const reviewRoutes = require('./routes/review.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use('/css', express.static(path.join(__dirname, '..', 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'public', 'js')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use(session({
  name: 'kids_winter_sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 14 }
}));
app.use(flash());
app.use(csrf());
app.use(localsMiddleware);

app.use(indexRoutes);
app.use(authRoutes);
app.use(catalogRoutes);
app.use(cartRoutes);
app.use(checkoutRoutes);
app.use(profileRoutes);
app.use(favoriteRoutes);
app.use(reviewRoutes);
app.use('/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
