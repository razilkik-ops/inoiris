function notFound(req, res) {
  res.status(404).render('pages/404', { title: 'Страница не найдена' });
}

function errorHandler(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error', 'Форма устарела. Попробуйте еще раз.');
    return res.redirect(req.get('referer') || '/');
  }
  console.error(err);
  res.status(500).render('pages/500', { title: 'Ошибка сервера', error: process.env.NODE_ENV === 'development' ? err : null });
}

module.exports = { notFound, errorHandler };
