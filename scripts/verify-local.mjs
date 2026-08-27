import assert from 'node:assert/strict';

const backendUrl = process.env.SMOKE_BACKEND_URL ?? 'http://localhost:3000';
const frontendUrl = process.env.SMOKE_FRONTEND_URL ?? 'http://localhost:4200';
const mailpitUrl = process.env.SMOKE_MAILPIT_URL ?? 'http://localhost:8025';
const email = `smoke-${Date.now()}@socialflow.local`;
const password = `local-${crypto.randomUUID()}`;

async function jsonRequest(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  return { response, body };
}

async function waitForActivationMessage() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`${mailpitUrl}/api/v1/messages`);
    assert.equal(response.ok, true, 'Mailpit API is unavailable');
    const inbox = await response.json();
    const message = inbox.messages.find((candidate) =>
      candidate.To?.some((recipient) => recipient.Address === email)
    );

    if (message) {
      const detail = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
      assert.equal(detail.ok, true, 'Captured email could not be read');
      return detail.json();
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error('Activation email was not captured within 30 seconds');
}

const [loginPage, backendHealth, mailpitHealth] = await Promise.all([
  fetch(`${frontendUrl}/auth/login`),
  fetch(`${backendUrl}/monitor/queue/default`),
  fetch(`${mailpitUrl}/readyz`),
]);
assert.equal(loginPage.ok, true, 'Frontend login page is unavailable');
assert.equal(backendHealth.ok, true, 'Backend health endpoint is unavailable');
assert.equal(mailpitHealth.ok, true, 'Mailpit is unavailable');

const registration = await jsonRequest(`${backendUrl}/auth/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    email,
    password,
    provider: 'LOCAL',
    providerToken: '',
    company: 'SocialFlow Smoke Test',
    datafast_visitor_id: '',
  }),
});
assert.equal(registration.response.status, 200);
assert.equal(
  registration.body.activate,
  true,
  'Registration skipped activation'
);

const message = await waitForActivationMessage();
const activationCode = message.HTML.match(/\/auth\/activate\/([^"<\s]+)/)?.[1];
assert.ok(activationCode, 'Activation link is missing from the captured email');

const activation = await jsonRequest(`${backendUrl}/auth/activate`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ code: activationCode, datafast_visitor_id: '' }),
});
assert.equal(activation.response.status, 200);
assert.equal(activation.body.can, true, 'Account activation failed');

const login = await jsonRequest(`${backendUrl}/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    email,
    password,
    provider: 'LOCAL',
    providerToken: '',
    datafast_visitor_id: '',
  }),
});
assert.equal(login.response.status, 200);
assert.equal(login.body.login, true);
const auth = login.response.headers.get('auth');
assert.ok(auth, 'Local login did not expose the development auth header');

const self = await jsonRequest(`${backendUrl}/user/self`, {
  headers: { auth },
});
assert.equal(self.response.status, 200);
assert.equal(self.body.email, email);
assert.equal(self.body.activated, true);

console.log(
  'Local smoke passed: frontend, backend, mail, activation and session'
);
