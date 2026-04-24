function startDeleteAsk(url, message) {
  const form = document.getElementById('deleteForm');
  const msg = document.getElementById('deleteMessage');

  form.action = url;
  msg.textContent = message;

  const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
  modal.show();
}