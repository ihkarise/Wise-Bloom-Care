/**
 * Personal Wellness Tracker staging smoke test. REAL end-to-end, run from a
 * GitHub Actions runner against the deployed system:
 *
 *   GitHub Pages (Astro)  ->  Apps Script Web App (/exec)  ->  Google Sheet
 *
 * No localhost, no mocks. Synthetic data only. Follows the proven Medicines
 * pattern (`e2e/medicines.spec.ts`) exactly. Each check is a `test.step`, so
 * a failure names the exact step.
 *
 * NOTE: this spec is written but has not been run — it requires a live
 * deployment (Phase 5/6), which is outside this Phase 2 implementation gate.
 *
 * Live-observable checks only. Two guarantees are NOT observable through the
 * deployed frontend and are covered by the backend integration suite instead
 * (apps/backend/tests/integration/tracking.test.ts):
 *   - foreign-family access is rejected 403 (needs a second family's token)
 *   - no tracker key/value in audit metadata (the audit log is never exposed
 *     via the API)
 * The live unauthenticated-rejection check below exercises the same
 * fail-closed boundary that is observable.
 */
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

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
  name: 'E2E Tracker Mother',
  email: `wb-e2e-tracking-${stamp}@example.com`,
  password: 'Synthetic-Passw0rd!',
};
const TRACKER_LABEL = 'Baby movement / kicking';

/** Wait for the authenticated app shell (Log out control) + the Tracking island, or fail loudly. */
async function expectTrackingApp(page: Page, action: string): Promise<void> {
  const shell = page.getByRole('button', { name: /Log out/i });
  const alert = page.getByRole('alert').first();
  try {
    await expect(shell.or(alert)).toBeVisible({ timeout: 90_000 });
  } catch {
    const url = page.url();
    const bodyStart = (await page.locator('body').innerText().catch(() => ''))
      .slice(0, 500)
      .replace(/\s+/g, ' ')
      .trim();
    throw new Error(`${action}: neither app shell nor alert after 90s. url=${url} bodyStart="${bodyStart}"`);
  }
  if (await alert.isVisible().catch(() => false)) {
    throw new Error(`${action} failed with an inline error: "${(await alert.innerText()).trim()}"`);
  }
  await expect(shell).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your tracking' })).toBeVisible({
    timeout: 60_000,
  });
}

/** Astro islands hydrate via dynamic import; wait for network idle before typing (see sprint02). */
async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
}

async function fillField(field: Locator, value: string): Promise<void> {
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

async function registerSynthetic(page: Page): Promise<void> {
  await gotoHydrated(page, '/register');
  await fillField(page.getByLabel('Your name'), SYNTH.name);
  await fillField(page.getByLabel('Email'), SYNTH.email);
  await fillField(page.getByLabel('Password'), SYNTH.password);
  const ack = page.getByRole('checkbox');
  await ack.check();
  await expect(ack).toBeChecked();
  await page.getByRole('button', { name: /Create account/i }).click();
  await expectTrackingApp(page, 'Registration');
}

async function loginSynthetic(page: Page): Promise<void> {
  await gotoHydrated(page, '/login');
  await fillField(page.getByLabel('Email'), SYNTH.email);
  await fillField(page.getByLabel('Password'), SYNTH.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expectTrackingApp(page, 'Login');
}

/** Direct backend call (bypasses the browser CORS layer) for the security-boundary check. */
async function backendError(
  request: APIRequestContext,
  query: Record<string, string>,
): Promise<{ code?: string; body: unknown }> {
  const res = await request.get(API, { params: query });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* Non-JSON (Google error page) — keep raw text for diagnosis. */
  }
  const code =
    typeof body === 'object' && body !== null
      ? (body as { error?: { code?: string } }).error?.code
      : undefined;
  return { code, body };
}

test('Wellness Tracker staging smoke — live frontend -> /exec -> Sheet', async ({ page, request }) => {
  test.setTimeout(600_000);

  const trackingCard = (): Locator =>
    page.locator('section[aria-labelledby="tracking-heading"]');

  await test.step('1. register a synthetic user (real Sheet write) and reach the tracker', async () => {
    await registerSynthetic(page);
  });

  await test.step('2. first-use empty state invites choosing a tracker', async () => {
    await expect(trackingCard().getByText('Choose what you’d like to track')).toBeVisible();
  });

  await test.step('3. open the picker and activate a tracker', async () => {
    await trackingCard().getByRole('button', { name: 'Choose trackers' }).click();
    await expect(trackingCard().getByText('Pregnancy')).toBeVisible({ timeout: 30_000 });
    await trackingCard().getByRole('switch', { name: TRACKER_LABEL }).click();
    await trackingCard().getByRole('button', { name: 'Done' }).click();
  });

  await test.step('4. the activated tracker appears in today’s active list', async () => {
    await expect(trackingCard().getByText(TRACKER_LABEL)).toBeVisible({ timeout: 60_000 });
  });

  await test.step('5. record a count observation (one tap)', async () => {
    const row = trackingCard().locator('li', { hasText: TRACKER_LABEL });
    await row.getByRole('button', { name: /Log another/i }).click();
    await expect(row.getByText('1')).toBeVisible({ timeout: 60_000 });
  });

  await test.step('6. per-tracker history shows the recorded entry', async () => {
    const row = trackingCard().locator('li', { hasText: TRACKER_LABEL });
    await row.getByRole('button', { name: 'View history' }).click();
    await expect(row.getByText('1', { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  await test.step('7. deactivate the tracker — it leaves today’s list but history is kept', async () => {
    await trackingCard().getByRole('button', { name: 'Choose trackers' }).click();
    await trackingCard().getByRole('switch', { name: TRACKER_LABEL }).click();
    await expect(trackingCard().getByText(/Inactive · last recorded/)).toBeVisible({
      timeout: 60_000,
    });
    await trackingCard().getByRole('button', { name: 'Done' }).click();
    await expect(trackingCard().getByText(TRACKER_LABEL)).not.toBeVisible();
  });

  await test.step('8. reactivate — the tracker returns with its history intact', async () => {
    await trackingCard().getByRole('button', { name: 'Choose trackers' }).click();
    await trackingCard().getByRole('switch', { name: TRACKER_LABEL }).click();
    await trackingCard().getByRole('button', { name: 'Done' }).click();
    await expect(trackingCard().getByText(TRACKER_LABEL)).toBeVisible({ timeout: 60_000 });
  });

  await test.step('9. no tracker event appears on the shared timeline (ADR-007)', async () => {
    await expect(page.getByText('Wellness', { exact: false })).toHaveCount(0);
  });

  await test.step('10. data persists across logout + login (real Sheet round-trip)', async () => {
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible({ timeout: 60_000 });
    await loginSynthetic(page);
    await expect(trackingCard().getByText(TRACKER_LABEL)).toBeVisible({ timeout: 60_000 });
  });

  await test.step('11. tracking endpoints reject unauthenticated access (fail closed)', async () => {
    const r = await backendError(request, { path: '/v1/tracking/preferences' });
    expect(
      r.code,
      `expected "unauthenticated", got: ${JSON.stringify(r.body).slice(0, 300)}`,
    ).toBe('unauthenticated');
  });
});
