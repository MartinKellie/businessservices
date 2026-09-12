'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PublicApiError, submitEnquiry } from '@/lib/api-contract';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  isAcceptedImageType,
} from '@/lib/media-constraints';
import {
  ENQUIRY_TYPES,
  fill,
  enquiryTypeLabel,
  isEnquiryType,
  type EnquiryType,
} from '@/lib/public-copy';
import { usePublicCopy } from '@/lib/use-public-copy';

const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_BYTES / (1024 * 1024)} MB`;
const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-warn" role="alert">
      {message}
    </p>
  );
}

export function ContactForm({ initialType }: { initialType?: string }) {
  const { copy } = usePublicCopy();
  const [type, setType] = useState<EnquiryType>(
    isEnquiryType(initialType) ? initialType : 'general',
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessReference, setBusinessReference] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (sent) successHeadingRef.current?.focus();
  }, [sent]);

  const fileHint = useMemo(() => fill(copy.fileHint, { size: MAX_UPLOAD_LABEL }), [copy.fileHint]);

  function reset() {
    setName('');
    setEmail('');
    setPhone('');
    setBusinessReference('');
    setMessage('');
    setCompany('');
    setConsent(false);
    setFile(null);
    setFields({});
    setFormError(null);
    setSent(false);
  }

  function onFile(next: File | null) {
    setFile(null);
    setFields((current) => {
      const next = { ...current };
      delete next.file;
      return next;
    });
    if (!next) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (!isAcceptedImageType(next.type)) {
      setFields((current) => ({ ...current, file: copy.fileBadType }));
      return;
    }
    if (next.size > MAX_UPLOAD_BYTES) {
      setFields((current) => ({
        ...current,
        file: fill(copy.fileTooLarge, { size: MAX_UPLOAD_LABEL }),
      }));
      return;
    }
    setFile(next);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent || sending) {
      if (!consent) setFormError(copy.consentRequired);
      return;
    }
    setSending(true);
    setFormError(null);
    setFields({});
    try {
      await submitEnquiry({
        type,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        businessReference: businessReference.trim() || undefined,
        message: message.trim(),
        consent: true,
        company: company.trim() || undefined,
        file,
      });
      setSent(true);
    } catch (err) {
      if (err instanceof PublicApiError) {
        setFields(err.fields ?? {});
        if (err.code === 'rate_limited') setFormError(copy.errorRate);
        else if (err.code === 'maintenance' || err.status === 503)
          setFormError(copy.maintenanceMessage);
        else if (err.fields && Object.keys(err.fields).length > 0) setFormError(err.message);
        else setFormError(err.message || copy.errorGeneric);
      } else {
        setFormError(copy.errorGeneric);
      }
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="bg-ink px-6 py-10 text-board sm:px-8">
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="font-display text-3xl font-extrabold uppercase tracking-wide outline-none"
        >
          {copy.successTitle}
        </h2>
        <p className="mt-4 text-base">{copy.successBody}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reset}
            className="border border-board px-5 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide hover:bg-board hover:text-ink"
          >
            {copy.sendAnother}
          </button>
          <Link href="/" className="inline-flex items-center underline-offset-4 hover:underline">
            {copy.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <fieldset>
        <legend className="font-semibold">{copy.enquiryType}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {ENQUIRY_TYPES.map((value) => {
            const active = type === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setType(value)}
                className={`border px-3 py-2 text-sm ${
                  active
                    ? 'border-ink bg-ink text-board'
                    : 'border-rail/40 hover:bg-ink hover:text-board'
                }`}
              >
                {enquiryTypeLabel(copy, value)}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Honeypot: bots that fill `company` get a fake success; people never see this. */}
      <div className="board-trap" aria-hidden="true">
        <input
          name="company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="block">
        <span className="font-semibold">{copy.fieldName}</span>
        <span className="letter-track mt-2 block border-b-2 border-rail">
          <input
            name="name"
            required
            minLength={2}
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="w-full bg-transparent py-2"
          />
        </span>
        <FieldError message={fields.name} />
      </label>

      <label className="block">
        <span className="font-semibold">{copy.fieldEmail}</span>
        <span className="letter-track mt-2 block border-b-2 border-rail">
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="w-full bg-transparent py-2"
          />
        </span>
        <FieldError message={fields.email} />
      </label>

      <label className="block">
        <span className="font-semibold">
          {copy.fieldPhone} <span className="font-normal text-muted">({copy.optional})</span>
        </span>
        <span className="letter-track mt-2 block border-b-2 border-rail">
          <input
            name="phone"
            type="tel"
            maxLength={40}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            className="w-full bg-transparent py-2"
          />
        </span>
        <FieldError message={fields.phone} />
      </label>

      <label className="block">
        <span className="font-semibold">
          {copy.fieldBusiness} <span className="font-normal text-muted">({copy.optional})</span>
        </span>
        <span className="letter-track mt-2 block border-b-2 border-rail">
          <input
            name="businessReference"
            maxLength={200}
            value={businessReference}
            onChange={(event) => setBusinessReference(event.target.value)}
            className="w-full bg-transparent py-2"
          />
        </span>
        <FieldError message={fields.businessReference} />
      </label>

      <label className="block">
        <span className="font-semibold">{copy.fieldMessage}</span>
        <span className="letter-track mt-2 block border-b-2 border-rail">
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="min-h-36 w-full resize-y bg-transparent py-2"
          />
        </span>
        <FieldError message={fields.message} />
      </label>

      <div>
        <p className="font-semibold">
          {copy.fieldFile} <span className="font-normal text-muted">({copy.optional})</span>
        </p>
        <p className="mt-1 text-sm text-muted">{fileHint}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="border border-rail/40 px-4 py-2 text-sm hover:bg-ink hover:text-board">
            {copy.fileChoose}
            <input
              ref={fileRef}
              type="file"
              name="file"
              accept={ACCEPT_ATTR}
              className="sr-only"
              onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {file ? (
            <>
              <span className="text-sm">{file.name}</span>
              <button
                type="button"
                onClick={() => onFile(null)}
                className="text-sm underline-offset-4 hover:underline"
              >
                {copy.fileRemove}
              </button>
            </>
          ) : null}
        </div>
        <FieldError message={fields.file} />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="enquiry-consent"
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          required
          className="board-check mt-0.5"
        />
        <p className="text-base leading-relaxed">
          <label htmlFor="enquiry-consent">{copy.consentLabel}</label>{' '}
          <Link href="/privacidad" className="underline-offset-4 hover:underline">
            {copy.privacyTitle}
          </Link>
        </p>
      </div>
      <FieldError message={fields.consent} />

      {formError ? (
        <p className="text-sm text-warn" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!consent || sending}
        className="bg-ink px-8 py-3 font-display text-lg font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink disabled:opacity-40 disabled:hover:bg-ink disabled:hover:text-board"
      >
        {sending ? copy.sendingEnquiry : copy.submitEnquiry}
      </button>
    </form>
  );
}
