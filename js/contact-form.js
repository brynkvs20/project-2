/**
 * Contact form handler — validation, AJAX submit, loading/success/error states.
 */
(function () {
  'use strict';

  var FORM_SELECTOR = '#ejtContactForm';
  var ENDPOINT = 'php/send-mail.php';

  function showAlert(form, type, message) {
    var alert = form.querySelector('.form-alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.className = 'form-alert';
      alert.setAttribute('role', 'alert');
      form.insertBefore(alert, form.firstChild);
    }
    alert.className = 'form-alert form-alert--' + type;
    alert.textContent = message;
    alert.hidden = false;
  }

  function hideAlert(form) {
    var alert = form.querySelector('.form-alert');
    if (alert) alert.hidden = true;
  }

  function setLoading(form, loading) {
    var btn = form.querySelector('[type="submit"]');
    if (!btn) return;
    btn.disabled = loading;
    btn.classList.toggle('is-loading', loading);
    var text = btn.querySelector('.btn-text');
    var loader = btn.querySelector('.btn-loader');
    if (text) text.hidden = loading;
    if (loader) loader.hidden = !loading;
  }

  function validateField(input) {
    var valid = input.checkValidity();
    input.classList.toggle('is-invalid', !valid);
    input.classList.toggle('is-valid', valid && input.value.trim() !== '');
    return valid;
  }

  function validateForm(form) {
    var inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    var allValid = true;
    inputs.forEach(function (input) {
      if (!validateField(input)) allValid = false;
    });
    return allValid;
  }

  function getFormData(form) {
    return {
      name: form.querySelector('[name="name"]').value.trim(),
      company: (form.querySelector('[name="company"]') || {}).value ? form.querySelector('[name="company"]').value.trim() : '',
      email: form.querySelector('[name="email"]').value.trim(),
      phone: form.querySelector('[name="phone"]').value.trim(),
      subject: form.querySelector('[name="subject"]').value.trim(),
      service: form.querySelector('[name="service"]').value,
      message: form.querySelector('[name="message"]').value.trim(),
      website_url: form.querySelector('[name="website_url"]') ? form.querySelector('[name="website_url"]').value : ''
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    hideAlert(form);

    if (!validateForm(form)) {
      showAlert(form, 'error', 'Please fill in all required fields correctly.');
      return;
    }

    setLoading(form, true);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getFormData(form))
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        setLoading(form, false);
        if (result.ok && result.data.success) {
          showAlert(form, 'success', result.data.message);
          form.reset();
          form.querySelectorAll('.is-valid, .is-invalid').forEach(function (el) {
            el.classList.remove('is-valid', 'is-invalid');
          });
          if (typeof $ !== 'undefined') $('select').niceSelect('update');
        } else {
          showAlert(form, 'error', result.data.message || 'Something went wrong. Please try again.');
        }
      })
      .catch(function () {
        setLoading(form, false);
        showAlert(form, 'error', 'Network error. Please check your connection and try again.');
      });
  }

  function init() {
    var forms = document.querySelectorAll(FORM_SELECTOR);
    forms.forEach(function (form) {
      form.addEventListener('submit', handleSubmit);
      form.querySelectorAll('input, textarea, select').forEach(function (input) {
        input.addEventListener('blur', function () { validateField(input); });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
