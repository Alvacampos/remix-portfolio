import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { ActionFunctionArgs, MetaFunction } from 'react-router';
import { data, Form, useActionData, useNavigation } from 'react-router';
import { z } from 'zod';

import { getCloudflare } from '~/utils/load-context';
import { mergeRouteMeta } from '~/utils/meta';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Contact — Gonzalo Alvarez Campos',
    description: 'Send me a note — questions, opportunities, or anything else.',
  });

const BLOCK = 'contact-route';
const getClasses = getClassMaker(BLOCK);

// Zod schema for the form payload. Honeypot is allowed but must be
// empty — bots that blindly fill every input land here. We reject by
// returning a success-shaped response (silent drop) so the bot has no
// signal to retry.
const ContactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z.string().min(2).max(120),
  message: z.string().min(10).max(4000),
  website: z.string().max(0), // honeypot — must be empty
});

type FieldErrors = Partial<Record<keyof z.infer<typeof ContactSchema>, string>>;
type ActionResponse =
  | { status: 'ok' }
  | { status: 'error'; reason: 'validation'; fieldErrors: FieldErrors }
  | { status: 'error'; reason: 'rate-limit' | 'send-failed' };

// Per-IP per-hour rate limit. KV is eventually consistent (~5-60s
// propagation) but that's fine for a soft cap — a real attacker would
// be slowed by the next eventually-consistent read, and a legitimate
// visitor would never hit the cap. Hashing the IP keeps the KV key
// shape opaque if the namespace is ever inspected.
const RATE_LIMIT_PER_HOUR = 3;

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function action({ request, context }: ActionFunctionArgs) {
  const { env } = getCloudflare(context);
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  // Validate first so a malformed payload can't poison the rate
  // limit. Silent-drop honeypot failures before validation reports
  // them — a bot getting "website too long" back is a signal.
  if (typeof raw.website === 'string' && raw.website.length > 0) {
    return data<ActionResponse>({ status: 'ok' });
  }

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === 'string') {
        fieldErrors[path as keyof FieldErrors] = mapIssueToIntlKey(path, issue.code);
      }
    }
    return data<ActionResponse>(
      { status: 'error', reason: 'validation', fieldErrors },
      { status: 400 }
    );
  }

  // Rate limit by client IP. CF-Connecting-IP is set by Cloudflare's
  // edge and is the canonical visitor IP regardless of any
  // X-Forwarded-For chain. Fall back to a sentinel so the rule still
  // fires under local dev (where the header is unset).
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local-dev';
  const key = `ratelimit:${await hashIp(ip)}`;
  const current = await env.RATELIMIT_KV.get(key);
  const count = current ? Number.parseInt(current, 10) || 0 : 0;
  if (count >= RATE_LIMIT_PER_HOUR) {
    return data<ActionResponse>({ status: 'error', reason: 'rate-limit' }, { status: 429 });
  }
  await env.RATELIMIT_KV.put(key, String(count + 1), { expirationTtl: 3600 });

  // Send via Resend. Bare fetch — no SDK dependency, no Node-isms to
  // shim. The from/to addresses live as plain vars in wrangler.jsonc;
  // the API key is a Worker secret (`npx wrangler secret put
  // RESEND_API_KEY`). Sandbox sender works without domain verification
  // but is rate-limited and marked "via resend.dev"; switch
  // CONTACT_FROM in wrangler.jsonc once the prod domain is verified.
  const { name, email, subject, message } = parsed.data;
  const html = `
    <h2>New contact-form submission</h2>
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <pre style="font-family: inherit; white-space: pre-wrap;">${escapeHtml(message)}</pre>
  `;

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: env.CONTACT_TO,
      reply_to: email,
      subject: `[CV contact] ${subject}`,
      html,
    }),
  });

  if (!resendResponse.ok) {
    // Log the body server-side for debugging without leaking it to
    // the client. The visitor sees a generic "try again" message.
    const body = await resendResponse.text();
    console.error('Resend send failed', resendResponse.status, body);
    return data<ActionResponse>({ status: 'error', reason: 'send-failed' }, { status: 502 });
  }

  return data<ActionResponse>({ status: 'ok' });
}

// Map a Zod issue (field + code) to the right intl key. The
// length-error keys are per-field so the copy can quote each field's
// actual character range — "between 2 and 80 characters" reads
// concretely; "too short or too long" doesn't. Email's `invalid_format`
// covers both empty + malformed strings since `z.email()` ships its
// own format check on the type.
function mapIssueToIntlKey(field: string, code: string): string {
  if (field === 'email') return 'CONTACT_VALIDATION_EMAIL';
  if (code === 'too_small' || code === 'too_big') {
    if (field === 'name') return 'CONTACT_VALIDATION_LENGTH_NAME';
    if (field === 'subject') return 'CONTACT_VALIDATION_LENGTH_SUBJECT';
    if (field === 'message') return 'CONTACT_VALIDATION_LENGTH_MESSAGE';
  }
  return 'CONTACT_VALIDATION_REQUIRED';
}

// Minimal HTML-escape for the email body. We never render this in the
// browser, but if Gmail / Outlook ever interpret a `<script>` we want
// it neutralised. Whitelist approach would be safer but overkill here.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function ContactRoute() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { formatMessage } = useIntl();
  const isSubmitting = navigation.state === 'submitting';

  // Track which `actionData` reference the user has dismissed so
  // error states (both per-field and form-level) disappear the
  // moment they start editing. Comparing identities means a fresh
  // server response automatically becomes "undismissed" again
  // without a useEffect — this is React's recommended state-reset-
  // on-prop-change pattern. Also disables the submit button while
  // any uncleared error is present, so the user can't resubmit the
  // same broken payload.
  const [dismissedRef, setDismissedRef] = useState<typeof actionData>(undefined);
  const dismissed = dismissedRef === actionData;
  const dismissOnEdit = () => {
    if (!dismissed) setDismissedRef(actionData);
  };

  const fieldErrors =
    !dismissed && actionData?.status === 'error' && actionData.reason === 'validation'
      ? actionData.fieldErrors
      : undefined;
  const formError =
    !dismissed && actionData?.status === 'error' && actionData.reason !== 'validation'
      ? actionData.reason
      : undefined;
  const hasActiveError = Boolean(fieldErrors || formError);

  // Render the success card in place of the form. The form unmounts,
  // so there's no double-submit risk and the visitor gets a clear
  // signal that the message went through.
  if (actionData?.status === 'ok') {
    return (
      <div className={getClasses()}>
        <h1 className="route-page-title">
          <FormattedMessage id="PAGE_TITLE_CONTACT" />
        </h1>
        <div className={getClasses('success')} role="status" aria-live="polite">
          <p className={getClasses('success-title')}>
            <FormattedMessage id="CONTACT_SUCCESS_TITLE" />
          </p>
          <p className={getClasses('success-body')}>
            <FormattedMessage id="CONTACT_SUCCESS_BODY" />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={getClasses()}>
      <h1 className="route-page-title">
        <FormattedMessage id="PAGE_TITLE_CONTACT" />
      </h1>
      <p className={getClasses('lead')}>
        <FormattedMessage id="CONTACT_LEAD" />
      </p>

      <Form method="post" className={getClasses('form')} noValidate>
        <Field
          name="name"
          type="text"
          autoComplete="name"
          label={formatMessage({ id: 'CONTACT_NAME_LABEL' })}
          error={fieldErrors?.name}
          onDismissError={dismissOnEdit}
        />
        <Field
          name="email"
          type="email"
          autoComplete="email"
          label={formatMessage({ id: 'CONTACT_EMAIL_LABEL' })}
          error={fieldErrors?.email}
          onDismissError={dismissOnEdit}
        />
        <Field
          name="subject"
          type="text"
          autoComplete="off"
          label={formatMessage({ id: 'CONTACT_SUBJECT_LABEL' })}
          error={fieldErrors?.subject}
          onDismissError={dismissOnEdit}
        />
        <Field
          name="message"
          textarea
          label={formatMessage({ id: 'CONTACT_MESSAGE_LABEL' })}
          error={fieldErrors?.message}
          onDismissError={dismissOnEdit}
        />

        {/* Honeypot — real users never see this. Tabindex -1 + aria-hidden
         * keep keyboard / AT users from landing on it; the CSS class
         * positions it off-screen. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          className={getClasses('honeypot')}
          defaultValue=""
        />

        {formError && (
          <p className={getClasses('form-error')} role="alert">
            <FormattedMessage
              id={formError === 'rate-limit' ? 'CONTACT_RATE_LIMITED' : 'CONTACT_ERROR'}
            />
          </p>
        )}

        <button
          type="submit"
          className={getClasses('submit')}
          disabled={isSubmitting || hasActiveError}
        >
          <FormattedMessage id={isSubmitting ? 'CONTACT_SUBMITTING' : 'CONTACT_SUBMIT'} />
        </button>
      </Form>
    </div>
  );
}

// Inline field component — keeps the form JSX scannable. Errors are
// resolved as intl keys server-side so the i18n boundary stays on the
// client. `onDismissError` fires on focus + input so the error vanishes
// the moment the user signals they're correcting the field; the parent
// uses the same handler to re-enable the submit button.
type FieldProps = {
  name: 'name' | 'email' | 'subject' | 'message';
  label: string;
  type?: string;
  autoComplete?: string;
  textarea?: boolean;
  error?: string;
  onDismissError?: () => void;
};

function Field({
  name,
  label,
  type = 'text',
  autoComplete = undefined,
  textarea = false,
  error = undefined,
  onDismissError = undefined,
}: FieldProps) {
  const id = `contact-${name}`;
  const errorId = `${id}-error`;
  return (
    <div className={getClasses('field')}>
      <label htmlFor={id} className={getClasses('label')}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={id}
          name={name}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onFocus={onDismissError}
          onInput={onDismissError}
          className={getClasses('textarea')}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onFocus={onDismissError}
          onInput={onDismissError}
          className={getClasses('input')}
        />
      )}
      {error && (
        <p id={errorId} className={getClasses('error')}>
          <FormattedMessage id={error} />
        </p>
      )}
    </div>
  );
}
