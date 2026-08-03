import { useState } from 'react';
import { submitContact } from '../../api/content';

const MAP_QUERY = encodeURIComponent('Vidyanidhi Education Complex, JVPD Scheme, Juhu, Mumbai 400049');

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.message.trim()) e.message = 'Enter a message.';
    if (form.message.length > 500) e.message = 'Message must be 500 characters or fewer.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError('');
    try {
      await submitContact(form);
      setDone(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container section">
      <div className="page-head">
        <div>
          <p className="eyebrow">Reach us</p>
          <h1 className="h2">Get in touch</h1>
          <p className="body-text">Institute information, location and a direct message form.</p>
        </div>
      </div>

      <div className="contact-top">
        <div className="card card-pad contact-method" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="circle" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <b style={{ marginTop: 12 }}>Visit us</b>
          <span style={{ marginTop: 4 }}>5th Floor, Vidyanidhi Education Complex, JVPD Scheme, Juhu, Mumbai 400049</span>
        </div>
        <div className="card card-pad contact-method" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="circle" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </div>
          <b style={{ marginTop: 12 }}>Call us</b>
          <span style={{ marginTop: 4 }}>90294 35311</span>
        </div>
        <div className="card card-pad contact-method" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="circle" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <b style={{ marginTop: 12 }}>Email us</b>
          <span style={{ marginTop: 4 }}>computerseekho10@gmail.com</span>
        </div>
      </div>

      <div className="contact-grid">
        <div>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <h3>Our Origin</h3>
            <p className="body-text" style={{ marginTop: 10 }}>
              USM's Vidyanidhi Info Tech Academy has trained students from the same Juhu campus since 1989 — from
              first-time computer users to graduates preparing for C-DAC diplomas, a short walk from Juhu Beach.
            </p>
          </div>
          <div className="map-frame">
            <iframe
              title="VITA campus location"
              src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="card card-pad form-card">
          {done ? (
            <div className="alert alert-ok">
              <b>Message sent — thank you.</b>
              <p style={{ marginTop: 6 }}>We'll get back to you at the email address you provided.</p>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 14 }} onClick={() => setDone(false)}>Send another message</button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <h3>Send us a message</h3>
              {error && <p className="alert alert-danger" style={{ marginTop: 12 }}>{error}</p>}
              <div className="field" style={{ marginTop: 16, marginBottom: 14 }}>
                <label>Name *</label>
                <input className={`input ${errors.name ? 'has-error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                {errors.name && <span className="error">{errors.name}</span>}
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label>Email *</label>
                <input className={`input ${errors.email ? 'has-error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your email address" />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
              <div className="field">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Message *</span>
                  <span className="muted" style={{ fontWeight: 400 }}>{form.message.length} / 500</span>
                </label>
                <textarea
                  className={`textarea ${errors.message ? 'has-error' : ''}`}
                  rows={6}
                  maxLength={500}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Type your message"
                />
                {errors.message && <span className="error">{errors.message}</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : 'Send message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}