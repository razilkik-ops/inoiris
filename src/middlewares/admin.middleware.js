function requireAdmin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Войдите в аккаунт администратора.');
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'ADMIN') {
    req.flash('error', 'Недостаточно прав.');
    return res.redirect('/');
  }
  return next();
}

module.exports = requireAdmin;
