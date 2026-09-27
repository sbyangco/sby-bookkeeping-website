const menu = document.querySelector('.hamb');
const links = document.querySelector('.links');

if (menu && links) {
  menu.addEventListener('click', () => links.classList.toggle('open'));
  document.querySelectorAll('.links a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const query = new URLSearchParams(location.search).get('sent');
if (query) {
  const n = document.createElement('div');
  n.textContent = query === 'testimonial'
    ? 'Thank you. Your testimonial was sent for review.'
    : 'Thank you. Your inquiry was sent.';
  Object.assign(n.style, {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    zIndex: 99,
    background: '#07182f',
    color: '#fff',
    padding: '14px 18px',
    borderRadius: '9px',
    fontWeight: 700,
    boxShadow: '0 15px 35px #0003'
  });
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 5000);
}

const apiUrl = (document.body.dataset.testimonialsApi || '').trim();
const testimonialList = document.getElementById('testimonialList');
const testimonialForm = document.getElementById('testimonialForm');
const testimonialStatus = document.getElementById('testimonialStatus');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTestimonials(items) {
  if (!testimonialList) return;

  const approved = Array.isArray(items) ? items : [];
  const cards = approved.map(item => {
    const role = item.businessRole ? `<small>${escapeHtml(item.businessRole)}</small>` : '';
    return `
      <article class="testimonial">
        <b class="quote">“</b>
        <p>${escapeHtml(item.testimonial)}</p>
        <strong>${escapeHtml(item.name)}</strong>
        ${role}
      </article>`;
  }).join('');

  const cta = `
    <article class="testimonial dark">
      <b class="quote">+</b>
      <h3>Be our next success story.</h3>
      <p>Have worked with SBY? Share your experience and, with your permission, your testimonial can be featured here.</p>
      <a href="#testimonial-form">Submit a testimonial →</a>
    </article>`;

  testimonialList.innerHTML = cards + cta;
}

async function loadTestimonials() {
  if (!testimonialList || !apiUrl || apiUrl.includes('PASTE_YOUR_')) return;

  try {
    const response = await fetch(`${apiUrl}?action=approved`, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load testimonials.');
    const data = await response.json();
    if (data.ok) renderTestimonials(data.testimonials);
  } catch (error) {
    console.error(error);
    // Keep the page usable even if the testimonial service is temporarily unavailable.
  }
}

if (testimonialForm) {
  testimonialForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!apiUrl || apiUrl.includes('PASTE_YOUR_')) {
      testimonialStatus.textContent = 'Testimonial service is not configured yet.';
      return;
    }

    const formData = new FormData(testimonialForm);
    const payload = {
      action: 'submit',
      name: formData.get('client_name'),
      businessRole: formData.get('client_business'),
      email: formData.get('client_email'),
      testimonial: formData.get('testimonial'),
      permission: formData.get('permission') === 'I give permission for SBY Bookkeeping Services to publish this testimonial on its website.'
    };

    if (!payload.name || !payload.email || !payload.testimonial || !payload.permission) {
      testimonialStatus.textContent = 'Please complete all required fields and give publication permission.';
      return;
    }

    const button = testimonialForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    testimonialStatus.textContent = 'Sending…';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Submission failed.');

      testimonialForm.reset();
      testimonialStatus.textContent = 'Thank you. Your testimonial was sent for review.';
    } catch (error) {
      console.error(error);
      testimonialStatus.textContent = 'We could not submit your testimonial. Please try again.';
    } finally {
      if (button) button.disabled = false;
    }
  });
}

loadTestimonials();
