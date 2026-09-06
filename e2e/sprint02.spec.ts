/**
 * Sprint 02 staging smoke test — REAL end-to-end, run from a GitHub Actions
 * runner against the deployed system:
 *
 *   GitHub Pages (Astro)  ->  Apps Script Web App (/exec)  ->  Google Sheet
 *
 * No localhost, no mocks. Synthetic data only. Each of the 19 checks is a
 * `test.step`, so a failure names the exact step. The frontend base path
 * (/Wise-Bloom-Care/) and the Apps Script /exec URL come from the environment.
 */
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const BASE = (process.env.E2E_BASE_URL ?? 'https://ihkarise.github.io/Wise-Bloom-Care').replace(
  /\/$/,
  '',
);
const API = (
  process.env.E2E_API_URL ??
  'https://script.google.com/macros/s/AKfycbxGTss7Hpkul4y299TGsTxQj2F26k2DhbHOp9TdvzrLwZJ9b183b5HOUtq6Iu700Cpx/exec'
).replace(/\/$/, '');

const stamp = Date.now();
const SYNTH = {
  name: 'E2E Synthetic Mother',
  email: `wb-e2e-${stamp}@example.com`,
  password: 'Synthetic-Passw0rd!',
};

/**
 * Wait for either the authenticated app shell or an inline error, and fail
 * loudly with the error text.
 *
 * The shell signal is the "Log out" control (always present once signed in);
 * the app's islands hydrate `client:load`, so the vitals form is present for
 * the checks that follow without any scroll gymnastics.
 */
async function expectAppOrError(page: Page, action: string): Promise<void> {
  const shell = page.getByRole('button', { name: /Log out/i });
  const alert = page.getByRole('alert').first();
  try {
    await expect(shell.or(alert)).toBeVisible({ timeout: 90_000 });
  } catch {
    // Neither the shell nor an inline error surfaced. Capture where the browser
    // actually ended up (no secrets) so the failure is diagnosable from the job
    // log rather than needing the trace artifact.
    const url = page.url();
    const loginHeadingCount = await page
      .getByRole('heading', { name: 'Log in' })
      .count()
      .catch(() => -1);
    const createBtn = await page
      .getByRole('button', { name: /Create account|Creating your account/i })
      .count()
      .catch(() => -1);
    const bodyStart = (await page.locator('body').innerText().catch(() => ''))
      .slice(0, 500)
      .replace(/\s+/g, ' ')
      .trim();
    throw new Error(
      `${action}: neither the app shell (Log out) nor an alert after 90s. ` +
        `url=${url} loginHeadingCount=${loginHeadingCount} createBtnCount=${createBtn} ` +
        `bodyStart="${bodyStart}"`,
    );
  }
  if (await alert.isVisible().catch(() => false)) {
    throw new Error(`${action} failed with an inline error: "${(await alert.innerText()).trim()}"`);
  }
  await expect(shell).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Log a vital' })).toBeVisible({ timeout: 60_000 });
}

async function registerSynthetic(page: Page): Promise<void> {
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Your name').fill(SYNTH.name);
  await page.getByLabel('Email').fill(SYNTH.email);
  await page.getByLabel('Password').fill(SYNTH.password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Create account/i }).click();
  await expectAppOrError(page, 'Registration');
}

async function loginSynthetic(page: Page): Promise<void> {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(SYNTH.email);
  await page.getByLabel('Password').fill(SYNTH.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expectAppOrError(page, 'Login');
}

/** Direct backend call (bypasses the browser CORS layer) for the security-boundary checks. */
async function backendError(
  request: APIRequestContext,
  query: Record<string, string>,
): Promise<{ status: number; code?: string; body: unknown }> {
  const res = await request.get(API, { params: query });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* Non-JSON (e.g. a Google error page) — return the raw text for diagnosis. */
  }
  const code =
    typeof body === 'object' && body !== null
      ? (body as { error?: { code?: string } }).error?.code
      : undefined;
  return { status: res.status(), code, body };
}

test('Sprint 02 staging smoke — 19 checks against the deployed system', async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(600_000);

  await test.step('1. site loads', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /One continuous record/i })).toBeVisible();
  });

  await test.step('2. login route loads', async () => {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  await test.step('3. register route loads', async () => {
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create account/i })).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
  });

  await test.step('4. registration (creates account, real Sheet write)', async () => {
    await registerSynthetic(page);
  });

  await test.step('5. login (second browser context, same synthetic credentials)', async () => {
    const ctx2 = await context.browser()!.newContext();
    const page2 = await ctx2.newPage();
    try {
      await loginSynthetic(page2);
    } finally {
      await ctx2.close();
    }
  });

  await test.step('6. authenticated session (app shell + logout control present)', async () => {
    await expect(page.getByRole('button', { name: /Log out/i })).toBeVisible();
  });

  await test.step('7. family / maternal record loads (vitals subject resolved)', async () => {
    // The Save button is disabled until getMaternal() resolves the family's subject id.
    await expect(page.getByRole('button', { name: /Save reading/i })).toBeEnabled({
      timeout: 60_000,
    });
  });

  await test.step('8. timeline loads (empty state for a fresh record)', async () => {
    await expect(page.getByRole('heading', { name: 'Your timeline' })).toBeVisible();
    await expect(page.getByText(/timeline is empty for now/i)).toBeVisible();
  });

  await test.step('9. dashboard loads (server-aggregated summary rendered)', async () => {
    await expect(page.getByText('Loading your dashboard…')).toBeHidden({ timeout: 60_000 });
    await expect(page.getByText(/Once you log a vital|into your pregnancy|pregnancy record/i).first())
      .toBeVisible();
  });

  await test.step('10. vital creation (log a weight reading)', async () => {
    await page.getByLabel('What would you like to log?').selectOption('weight');
    await page.getByLabel(/Weight \(kg\)/).fill('62.5');
    await page.getByRole('button', { name: /Save reading/i }).click();
  });

  await test.step('12. trend display (current reading surfaced)', async () => {
    await expect(page.getByText('62.5 kg').first()).toBeVisible({ timeout: 60_000 });
  });

  await test.step('11. vital appears on the timeline (reload -> Vital logged)', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Vital logged').first()).toBeVisible({ timeout: 60_000 });
  });

  await test.step('13. report metadata (upload a synthetic lab report)', async () => {
    await page.getByLabel('Report type').selectOption('lab');
    await page.getByLabel('Choose a file').setInputFiles({
      name: 'synthetic-lab.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 synthetic e2e report'),
    });
    await page.getByRole('button', { name: /Upload report/i }).click();
    await expect(page.getByRole('button', { name: /Get secure link/i }).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  await test.step('14. report appears on the timeline (reload -> Report)', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Report', { exact: true }).first()).toBeVisible({ timeout: 60_000 });
  });

  await test.step('15. protected endpoint rejects unauthenticated access', async () => {
    const r = await backendError(request, { path: '/v1/timeline' });
    expect(
      r.code,
      `expected an "unauthenticated" error envelope, got: ${JSON.stringify(r.body).slice(0, 300)}`,
    ).toBe('unauthenticated');
  });

  await test.step('16. media privacy boundary (minting a media ref requires auth)', async () => {
    const r = await backendError(request, { path: '/v1/reports/media', report_id: 'anything' });
    // No public media: an unauthenticated media request must be refused, never served.
    expect(['unauthenticated', 'forbidden', 'not_found']).toContain(r.code);
  });

  await test.step('17. logout (session cleared, returns to login)', async () => {
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible({ timeout: 60_000 });
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('wise-bloom.session.v1'),
    );
    expect(stored).toBeNull();
  });

  await test.step('18. session persists across a reload after logging back in', async () => {
    await loginSynthetic(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Log a vital' })).toBeVisible({
      timeout: 60_000,
    });
  });

  await test.step('19. direct navigation to /app without a session redirects to login', async () => {
    const ctx3 = await context.browser()!.newContext();
    const page3 = await ctx3.newPage();
    try {
      await page3.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
      await expect(page3.getByRole('heading', { name: 'Log in' })).toBeVisible({ timeout: 60_000 });
    } finally {
      await ctx3.close();
    }
  });
});
