/**
 * Sprint 03 Phase 2 — Medicines staging smoke test. REAL end-to-end, run from a
 * GitHub Actions runner against the deployed system:
 *
 *   GitHub Pages (Astro)  ->  Apps Script Web App (/exec)  ->  Google Sheet
 *
 * No localhost, no mocks. Synthetic data only. Reuses the proven Sprint 02
 * hydration/auth patterns. Each check is a `test.step`, so a failure names the
 * exact step.
 *
 * Live-observable checks only. Two medicines guarantees are NOT observable
 * through the deployed frontend or any endpoint and are covered by the backend
 * integration suite instead (apps/backend/tests/integration/medicines-timeline):
 *   - foreign-family access is rejected 403 (needs a second family's token +
 *     another family's med_id; not surfaced in the UI)
 *   - no medicine name/PHI in audit metadata (the audit log is never exposed via
 *     the API)
 * The live unauthenticated-rejection check below exercises the same fail-closed
 * boundary that is observable.
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
  name: 'E2E Meds Mother',
  email: `wb-e2e-meds-${stamp}@example.com`,
  password: 'Synthetic-Passw0rd!',
};
const MED = {
  name: `Iron tablet (E2E ${stamp})`,
  schedule: 'Every morning',
  schedule2: 'Twice daily with food',
};

/** Wait for the authenticated app shell (Log out control) + the Medicines island, or fail loudly. */
async function expectMedicinesApp(page: Page, action: string): Promise<void> {
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
  await expect(page.getByRole('heading', { name: 'Medicines' })).toBeVisible({ timeout: 60_000 });
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
  await expectMedicinesApp(page, 'Registration');
}

async function loginSynthetic(page: Page): Promise<void> {
  await gotoHydrated(page, '/login');
  await fillField(page.getByLabel('Email'), SYNTH.email);
  await fillField(page.getByLabel('Password'), SYNTH.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expectMedicinesApp(page, 'Login');
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

test('Medicines staging smoke — live frontend -> /exec -> Sheet', async ({ page, request }) => {
  test.setTimeout(600_000);

  // The medicine's own list row (an <li>), located by its unique synthetic name.
  const row = (): Locator => page.getByRole('listitem').filter({ hasText: MED.name });

  await test.step('1. register a synthetic user (real Sheet write) and reach Medicines', async () => {
    await registerSynthetic(page);
  });

  await test.step('2. add a synthetic medicine (name + schedule)', async () => {
    const addForm = page.getByRole('form', { name: 'Add a medicine' });
    await fillField(addForm.getByLabel('Medicine name'), MED.name);
    await fillField(addForm.getByLabel('Schedule'), MED.schedule);
    const addBtn = addForm.getByRole('button', { name: 'Add medicine' });
    // The button enables once the mother's record has resolved (subjectReady)
    // and both fields are non-empty; wait for that before clicking (GAS is slow).
    await expect(addBtn).toBeEnabled({ timeout: 60_000 });
    await addBtn.click();
    // Wait for the medicine to appear OR an inline error, and fail loudly with the
    // error text so a real backend failure is diagnosable from the job log.
    const appeared = page.getByText(MED.name);
    const alert = page.getByRole('alert').first();
    await expect(appeared.or(alert)).toBeVisible({ timeout: 60_000 });
    if (await alert.isVisible().catch(() => false)) {
      throw new Error(
        `Add medicine failed with an inline error: "${(await alert.innerText()).trim()}"`,
      );
    }
    await expect(appeared).toBeVisible();
  });

  await test.step('3. medicine appears in the list as active, with its schedule', async () => {
    await expect(row()).toBeVisible({ timeout: 60_000 });
    await expect(row().getByText(MED.schedule)).toBeVisible();
    await expect(row().getByText('Active')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Currently taking' })).toBeVisible();
  });

  await test.step('4. medicine appears on the one continuous timeline', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectMedicinesApp(page, 'Timeline reload');
    await expect(page.getByText('Medicine', { exact: true }).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  await test.step('5. edit the medicine schedule (versioned update)', async () => {
    await row().getByRole('button', { name: 'Edit' }).click();
    // In edit mode the medicine name becomes an <input value> rather than visible
    // text, so the hasText row() locator no longer matches. The editing row is the
    // only list item that contains a "Save changes" button — scope to it.
    const editForm = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: 'Save changes' }) });
    await fillField(editForm.getByLabel('Schedule'), MED.schedule2);
    await editForm.getByRole('button', { name: 'Save changes' }).click();
    await expect(row().getByText(MED.schedule2)).toBeVisible({ timeout: 60_000 });
  });

  await test.step('6. stop the medicine (confirmation required; history retained)', async () => {
    await row().getByRole('button', { name: 'Stop' }).click();
    await expect(row().getByText(/Stop taking this medicine\?/)).toBeVisible();
    await row().getByRole('button', { name: 'Yes, stop' }).click();
    // Still present (never hard-deleted), now marked Stopped.
    await expect(row()).toBeVisible({ timeout: 60_000 });
    await expect(row().getByText('Stopped')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: 'Stopped' })).toBeVisible();
  });

  await test.step('7. restart the stopped medicine', async () => {
    await row().getByRole('button', { name: 'Start again' }).click();
    await expect(row().getByText('Active')).toBeVisible({ timeout: 60_000 });
  });

  await test.step('8. data persists across logout + login (real Sheet round-trip)', async () => {
    await page.getByRole('button', { name: /Log out/i }).click();
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible({ timeout: 60_000 });
    await loginSynthetic(page);
    await expect(page.getByText(MED.name)).toBeVisible({ timeout: 60_000 });
    await expect(row().getByText(MED.schedule2)).toBeVisible();
    await expect(row().getByText('Active')).toBeVisible();
  });

  await test.step('9. medicines endpoint rejects unauthenticated access (fail closed)', async () => {
    const r = await backendError(request, { path: '/v1/medicines' });
    expect(
      r.code,
      `expected "unauthenticated", got: ${JSON.stringify(r.body).slice(0, 300)}`,
    ).toBe('unauthenticated');
  });
});
