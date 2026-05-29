document.querySelectorAll('.danger').forEach((button) => {
  button.addEventListener('click', (event) => {
    if (!confirm('Подтвердить действие?')) event.preventDefault();
  });
});
