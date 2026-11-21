import { useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError, type EnquiryInput } from '../api/client';

type Fields = Omit<EnquiryInput, 'productId'>;
const empty: Fields = { name: '', email: '', phone: '', message: '', website: '' };

export function EnquiryForm({ productId }: { productId: string }) {
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (key: keyof Fields) => (e: { target: { value: string } }) =>
    setFields({ ...fields, [key]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError('');
    try {
      await api.sendEnquiry({ productId, ...fields });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.fields.length > 0) {
        setErrors(Object.fromEntries(err.fields.map((f) => [f.field, f.message])));
      } else {
        setFormError(err instanceof Error ? err.message : 'Something went wrong');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div role="status" className="thank-you">
        <h2>Thank you!</h2>
        <p>We have received your enquiry. Our sales team will be in touch soon.</p>
      </div>
    );
  }

  const field = (key: keyof Fields, label: string, input: ReactNode) => (
    <div className="field">
      <label htmlFor={`enquiry-${key}`}>{label}</label>
      {input}
      {errors[key] && (
        <span className="field-error" id={`enquiry-${key}-error`}>
          {errors[key]}
        </span>
      )}
    </div>
  );

  const common = (key: keyof Fields) => ({
    id: `enquiry-${key}`,
    value: fields[key],
    onChange: update(key),
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `enquiry-${key}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} className="enquiry" aria-label="Enquiry form" noValidate>
      {field('name', 'Name', <input {...common('name')} required maxLength={100} autoComplete="name" />)}
      {field('email', 'Email', <input {...common('email')} type="email" required maxLength={200} autoComplete="email" />)}
      {field('phone', 'Phone (optional)', <input {...common('phone')} type="tel" maxLength={30} autoComplete="tel" />)}
      {field('message', 'Message (optional)', <textarea {...common('message')} rows={4} maxLength={2000} />)}

      {/* Honeypot: hidden from people, but simple bots fill it in. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="enquiry-website">Website</label>
        <input id="enquiry-website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={update('website')} />
      </div>

      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
