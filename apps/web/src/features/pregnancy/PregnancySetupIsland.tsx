/**
 * PregnancySetupIsland — creates the pregnancy episode (docs/06-Modules/82,
 * docs/20-Implementation/206 objective 6). Entry is forgiving: every field
 * is optional (P9) — LMP unknown is a valid, expected state, not an error.
 * Gestational age is never computed here; it is only ever displayed exactly
 * as the API returns it (docs/04-Architecture/51 BR-3, 82 BR-1).
 */
import { useEffect, useId, useState, type FormEvent, type ReactElement } from 'react';

import { createPregnancyEpisode, listPregnancyEpisodes } from '../../api/maternal';
import { friendlyErrorMessage } from '../../lib/errors';
import { useAuthenticatedClient } from '../../state/session';

import type { PregnancyEpisodeResponse } from '@wise-bloom/api-contract';
import type { BmiCategory, Parity } from '@wise-bloom/domain-types';

export interface PregnancySetupIslandProps {
  apiBaseUrl: string;
}

function describeGestationalAge(item: PregnancyEpisodeResponse): string {
  if (!item.gestational_age) {
    return 'Gestational age will appear once you add your last menstrual period.';
  }
  const { weeks, daysIntoWeek } = item.gestational_age;
  return `About ${weeks} week${weeks === 1 ? '' : 's'}${daysIntoWeek ? `, ${daysIntoWeek} day${daysIntoWeek === 1 ? '' : 's'}` : ''} along.`;
}

export default function PregnancySetupIsland({
  apiBaseUrl,
}: PregnancySetupIslandProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const [existing, setExisting] = useState<PregnancyEpisodeResponse[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [lmp, setLmp] = useState('');
  const [edd, setEdd] = useState('');
  const [bmiCategory, setBmiCategory] = useState<BmiCategory | ''>('');
  const [parity, setParity] = useState<Parity | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<PregnancyEpisodeResponse | null>(null);

  const lmpId = useId();
  const eddId = useId();
  const bmiId = useId();
  const parityId = useId();

  useEffect(() => {
    if (!client) {
      return;
    }
    listPregnancyEpisodes(client)
      .then((page) => setExisting(page.items))
      .catch((caught: unknown) => setLoadError(friendlyErrorMessage(caught)));
  }, [client]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!client) {
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await createPregnancyEpisode(client, {
        ...(lmp ? { lmp } : {}),
        ...(edd ? { edd } : {}),
        ...(bmiCategory ? { pre_pregnancy_bmi_cat: bmiCategory } : {}),
        ...(parity ? { parity } : {}),
      });
      setCreated(result);
    } catch (caught) {
      setSubmitError(friendlyErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (!checked) {
    return null; // avoid a flash of the form before we know whether a session exists
  }

  const active = created ?? existing?.find((item) => item.episode.status === 'active') ?? null;

  if (active) {
    return (
      <div className="rounded-md border border-border bg-surface-raised p-4">
        <h2 className="text-h3 font-semibold text-text-primary">Your pregnancy</h2>
        <p className="mt-1 text-body text-text-secondary">{describeGestationalAge(active)}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <h2 className="text-h3 font-semibold text-text-primary">Set up your pregnancy</h2>
      <p className="text-small text-text-secondary">
        Every field below is optional — add what you know now, and fill in the rest later.
      </p>

      {loadError ? (
        <p role="alert" className="text-small text-caution">
          {loadError}
        </p>
      ) : null}
      {submitError ? (
        <p
          role="alert"
          className="rounded-md border border-caution bg-surface p-3 text-small text-text-primary"
        >
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor={lmpId} className="text-small font-medium text-text-primary">
          First day of your last period (optional)
        </label>
        <input
          id={lmpId}
          type="date"
          value={lmp}
          onChange={(event) => setLmp(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={eddId} className="text-small font-medium text-text-primary">
          Estimated due date (optional)
        </label>
        <input
          id={eddId}
          type="date"
          value={edd}
          onChange={(event) => setEdd(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={bmiId} className="text-small font-medium text-text-primary">
          Pre-pregnancy BMI category (optional)
        </label>
        <select
          id={bmiId}
          value={bmiCategory}
          onChange={(event) => setBmiCategory(event.target.value as BmiCategory | '')}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <option value="">Prefer not to say / unknown</option>
          <option value="under25">Under 25</option>
          <option value="25to29">25–29</option>
          <option value="30plus">30 or above</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={parityId} className="text-small font-medium text-text-primary">
          Have you given birth before? (optional)
        </label>
        <select
          id={parityId}
          value={parity}
          onChange={(event) => setParity(event.target.value as Parity | '')}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <option value="">Prefer not to say / unknown</option>
          <option value="nulliparous">No, this is my first</option>
          <option value="parous">Yes, I have before</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting || !client}
        className="rounded-md bg-action px-4 py-2 text-body font-medium text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
