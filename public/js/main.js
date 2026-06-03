document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!confirm(form.dataset.confirm)) event.preventDefault();
  });
});

document.querySelectorAll('.alert').forEach((alert) => {
  if (alert.querySelector('[data-alert-close]')) return;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'alert-close';
  close.setAttribute('aria-label', 'Закрыть уведомление');
  close.dataset.alertClose = 'true';
  close.textContent = '×';
  let isDismissed = false;
  const dismissAlert = () => {
    if (isDismissed) return;
    isDismissed = true;
    alert.classList.add('is-hiding');
    window.setTimeout(() => {
      const alerts = alert.parentElement;
      alert.remove();
      if (alerts?.classList.contains('alerts') && !alerts.querySelector('.alert')) {
        alerts.remove();
      }
    }, 220);
  };
  close.addEventListener('click', dismissAlert);
  alert.append(close);

  if (alert.dataset.autoDismiss === 'true') {
    window.setTimeout(dismissAlert, 3200);
  }
});

document.querySelectorAll('.auth-eye').forEach((button) => {
  const input = button.closest('.auth-input-wrap')?.querySelector('input');
  if (!input) return;

  button.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.setAttribute('aria-label', isPassword ? 'Скрыть пароль' : 'Показать пароль');
  });
});

const menuDetails = document.querySelector('[data-menu-details]');
const siteMenu = document.querySelector('[data-site-menu]');
if (menuDetails && siteMenu) {
  const closeMenu = () => {
    menuDetails.removeAttribute('open');
  };

  siteMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeMenu();
    menuDetails.querySelector('summary')?.focus();
  });
}

const filterShell = document.querySelector('[data-filter-shell]');
if (filterShell) {
  const filterToggle = filterShell.querySelector('[data-filter-toggle]');
  const filterCard = filterShell.querySelector('.catalog-filter-card');

  const setFilterOpen = (isOpen) => {
    filterShell.classList.toggle('is-open', isOpen);
    filterToggle?.setAttribute('aria-expanded', String(isOpen));
  };

  filterToggle?.addEventListener('click', () => {
    setFilterOpen(!filterShell.classList.contains('is-open'));
  });

  filterShell.querySelector('[data-filter-close]')?.addEventListener('click', () => {
    setFilterOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!filterShell.classList.contains('is-open')) return;
    if (filterCard?.contains(event.target) || filterToggle?.contains(event.target)) return;
    setFilterOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    setFilterOpen(false);
  });
}

document.querySelectorAll('.cart-qty-form').forEach((form) => {
  const input = form.querySelector('input[name="quantity"]');
  const minus = form.querySelector('[data-cart-qty-minus]');
  const plus = form.querySelector('[data-cart-qty-plus]');
  if (!input) return;

  const submitQuantity = (nextValue) => {
    const min = Number(input.min) || 1;
    const max = Number(input.max) || Infinity;
    const current = Number(input.value) || min;
    const next = Math.max(min, Math.min(max, nextValue));
    if (next === current) return;
    input.value = next;
    form.requestSubmit();
  };

  minus?.addEventListener('click', () => submitQuantity((Number(input.value) || 1) - 1));
  plus?.addEventListener('click', () => submitQuantity((Number(input.value) || 1) + 1));
});

const heroSlider = document.querySelector('[data-hero-slider]');
if (heroSlider) {
  const slides = [
    {
      image: '/uploads/home-hero-child.png',
      title: 'Тепло, стиль<br>и свобода движения',
      text: 'Премиальные зимние куртки для детей от 2 до 14 лет. Защита от холода, ветра и влаги в любую погоду.'
    },
    {
      image: '/uploads/home-hero-child-2.png',
      title: 'Зима яркая,<br>удобная и тёплая',
      text: 'Мягкие утеплители, продуманные капюшоны и посадка, в которой удобно гулять, бегать и играть.'
    },
    {
      image: '/uploads/home-hero-child-3.png',
      title: 'Куртки для<br>каждого снежного дня',
      text: 'Лёгкие мембранные модели защищают от ветра и снега, сохраняя комфорт во время активных прогулок.'
    }
  ];

  const title = heroSlider.querySelector('[data-hero-title]');
  const text = heroSlider.querySelector('[data-hero-text]');
  const dots = heroSlider.querySelectorAll('[data-slide]');

  slides.forEach((slide) => {
    const img = new Image();
    img.src = slide.image;
  });

  function setSlide(index) {
    const slide = slides[index] || slides[0];
    heroSlider.style.setProperty('--hero-image', `url('${slide.image}')`);
    title.innerHTML = slide.title;
    text.textContent = slide.text;
    dots.forEach((dot) => dot.classList.toggle('active', Number(dot.dataset.slide) === index));
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => setSlide(Number(dot.dataset.slide)));
  });
}

const liveFilterForm = document.querySelector('[data-live-filters]');
if (liveFilterForm) {
  liveFilterForm.querySelectorAll('input[name="ageGroup"], input[name="season"], input[name="temperatureRange"]').forEach((control) => {
    control.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') liveFilterForm.requestSubmit();
    });
  });

  const priceSlider = liveFilterForm.querySelector('[data-price-slider]');
  if (priceSlider) {
    const minInput = priceSlider.querySelector('input[name="minPrice"]');
    const maxInput = priceSlider.querySelector('input[name="maxPrice"]');
    const minOutput = liveFilterForm.querySelector('[data-price-min]');
    const maxOutput = liveFilterForm.querySelector('[data-price-max]');

    const syncPriceSlider = (changed) => {
      let min = Number(minInput.value);
      let max = Number(maxInput.value);
      const minLimit = Number(minInput.min);
      const maxLimit = Number(minInput.max);
      const gap = Number(minInput.step) || 5;

      if (max - min < gap) {
        if (changed === minInput) min = max - gap;
        else max = min + gap;
      }
      min = Math.max(minLimit, Math.min(min, maxLimit - gap));
      max = Math.min(maxLimit, Math.max(max, minLimit + gap));

      minInput.value = min;
      maxInput.value = max;
      minOutput.textContent = min;
      maxOutput.textContent = max;

      const minPercent = ((min - minLimit) / (maxLimit - minLimit)) * 100;
      const maxPercent = ((max - minLimit) / (maxLimit - minLimit)) * 100;
      priceSlider.style.setProperty('--min', `${minPercent}%`);
      priceSlider.style.setProperty('--max', `${maxPercent}%`);
    };

    [minInput, maxInput].forEach((input) => {
      input.addEventListener('input', () => syncPriceSlider(input));
    });
    syncPriceSlider();
  }
}

const productDetail = document.querySelector('[data-product-detail]');
if (productDetail) {
  const mainPhoto = productDetail.querySelector('[data-main-photo]');
  const thumbs = [...productDetail.querySelectorAll('[data-thumb]')];
  const photos = thumbs.map((thumb) => thumb.querySelector('img').getAttribute('src'));
  let activePhoto = 0;

  function setPhoto(index) {
    activePhoto = (index + photos.length) % photos.length;
    mainPhoto.src = photos[activePhoto];
    thumbs.forEach((thumb) => thumb.classList.toggle('active', Number(thumb.dataset.thumb) === activePhoto));
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => setPhoto(Number(thumb.dataset.thumb)));
  });
  productDetail.querySelector('[data-gallery-prev]')?.addEventListener('click', () => setPhoto(activePhoto - 1));
  productDetail.querySelector('[data-gallery-next]')?.addEventListener('click', () => setPhoto(activePhoto + 1));

  const variants = JSON.parse(productDetail.dataset.variants || '[]');
  const variantInput = productDetail.querySelector('[data-variant-id]');
  const qtyInput = productDetail.querySelector('[data-qty-input]');
  const colorInputs = [...productDetail.querySelectorAll('input[name="uiColor"]')];
  const sizeInputs = [...productDetail.querySelectorAll('input[name="uiSize"]')];

  function syncVariant() {
    const colorId = Number(colorInputs.find((input) => input.checked)?.value);
    const sizeId = Number(sizeInputs.find((input) => input.checked)?.value);
    const variant = variants.find((item) => item.colorId === colorId && item.sizeId === sizeId && item.stock > 0)
      || variants.find((item) => item.colorId === colorId && item.stock > 0)
      || variants.find((item) => item.sizeId === sizeId && item.stock > 0)
      || variants[0];
    if (!variant) return;
    variantInput.value = variant.id;
    qtyInput.max = Math.max(1, variant.stock);
    if (Number(qtyInput.value) > Number(qtyInput.max)) qtyInput.value = qtyInput.max;
  }

  [...colorInputs, ...sizeInputs].forEach((input) => input.addEventListener('change', syncVariant));
  productDetail.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
    qtyInput.value = Math.max(Number(qtyInput.min), Number(qtyInput.value) - 1);
  });
  productDetail.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
    qtyInput.value = Math.min(Number(qtyInput.max), Number(qtyInput.value) + 1);
  });
  syncVariant();
}
