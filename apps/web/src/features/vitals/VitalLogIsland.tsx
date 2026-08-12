/**
 * VitalLogIsland — log a maternal vital in seconds and see current/previous/
 * trend + a calm chart (docs/06-Modules/83, docs/20-Implementation/207 MS-1.3).
 * Mobile-first (docs/03-UX/41). All network goes through `api/` (51 BR-1);
 * trends are read from the server response, never computed here (83 BR-1).
 *
 * Blood pressure is submitted as one reading (systolic + diastolic); the
 * backend stores it as two rows and returns a paired trend — the UI treats it
 * as one BP reading throughout.
 */
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactElement } from 'react';

import { getMaternal } from '../../api/maternal';
import { logBloodPressure, logVital } from '../../api/vitals';
import { friendlyErrorMessage } from '../../lib/errors';
import { useAuthenticatedClient } from '../../state/session';
import { useVitalSeries } from '../../state/vitals';
import VitalChart from './VitalChart';
import VitalTrendCard from './VitalTrendCard';

import type { ChartPoint } from '../../lib/charts';
import type { CreateBloodPressureResponse, CreateVitalResponse } from '@wise-bloom/api-contract';
import type { Vital, VitalContext } from '@wise-bloom/domain-types';

export interface VitalLogIslandProps {
  apiBaseUrl: string;
}

type Kind = 'weight' | 'blood_sugar' | 'bp';

const KIND_LABEL: Record<Kind, string> = {
  weight: 'Weight',
  blood_sugar: 'Blood sugar',
  bp: 'Blood pressure',
};

function toPoints(vitals: Vital[], context?: VitalContext): ChartPoint[] {
  return vitals
    .filter((v) => context === undefined || v.context === context)
    .map((v) => ({ value: v.value, at: v.measured_at }));
}

function nowLocalDatetime(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function VitalLogIsland({ apiBaseUrl }: VitalLogIslandProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const [kind, setKind] = useState<Kind>('weight');
  const [value, setValue] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [measuredAt, setMeasuredAt] = useState(nowLocalDatetime());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [single, setSingle] = useState<CreateVitalResponse | null>(null);
  const [bp, setBp] = useState<CreateBloodPressureResponse | null>(null);

  const series = useVitalSeries(client, kind);

  const kindId = useId();
  const valueId = useId();
  const sysId = useId();
  const diaId = useId();
  const whenId = useId();

  useEffect(() => {
    if (!client) {
      return;
    }
    getMaternal(client)
      .then((response) => setSubjectId(response.maternal.maternal_id))
      .catch(() => setError('We couldn’t load your record right now. Please try again.'));
  }, [client]);

  // Reset the last result when switching what we're logging.
  useEffect(() => {
    setSingle(null);
    setBp(null);
  }, [kind]);

  const points = useMemo(() => toPoints(series.vitals), [series.vitals]);
  const systolicPoints = useMemo(() => toPoints(series.vitals, 'systolic'), [series.vitals]);
  const diastolicPoints = useMemo(() => toPoints(series.vitals, 'diastolic'), [series.vitals]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!client || !subjectId) {
      return;
    }
    setError(null);
    setSubmitting(true);
    const iso = measuredAt ? new Date(measuredAt).toISOString() : new Date().toISOString();
    try {
      if (kind === 'bp') {
        const result = await logBloodPressure(client, {
          subject_id: subjectId,
          type: 'bp',
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          measured_at: iso,
        });
        setBp(result);
        setSystolic('');
        setDiastolic('');
      } else {
        const result = await logVital(client, {
          subject_id: subjectId,
          type: kind,
          value: Number(value),
          unit: kind === 'weight' ? 'kg' : 'mg/dL',
          measured_at: iso,
        });
        setSingle(result);
        setValue('');
      }
      series.reload();
    } catch (caught) {
      setError(friendlyErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (!checked) {
    return null;
  }

  const inputClass =
    'rounded-md border border-border bg-surface-raised px-3 py-2 text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  return (
    <section aria-labelledby="vitals-heading" className="flex flex-col gap-4">
      <h2 id="vitals-heading" className="text-h3 font-semibold text-text-primary">
        Log a vital
      </h2>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-caution bg-surface p-3 text-small text-text-primary"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-1">
          <label htmlFor={kindId} className="text-small font-medium text-text-primary">
            What would you like to log?
          </label>
          <select
            id={kindId}
            value={kind}
            onChange={(event) => setKind(event.target.value as Kind)}
            className={inputClass}
          >
            <option value="weight">Weight (kg)</option>
            <option value="blood_sugar">Blood sugar (mg/dL)</option>
            <option value="bp">Blood pressure (mmHg)</option>
          </select>
        </div>

        {kind === 'bp' ? (
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor={sysId} className="text-small font-medium text-text-primary">
                Systolic (top)
              </label>
              <input
                id={sysId}
                type="number"
                inputMode="numeric"
                min="1"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor={diaId} className="text-small font-medium text-text-primary">
                Diastolic (bottom)
              </label>
              <input
                id={diaId}
                type="number"
                inputMode="numeric"
                min="1"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor={valueId} className="text-small font-medium text-text-primary">
              {KIND_LABEL[kind]} ({kind === 'weight' ? 'kg' : 'mg/dL'})
            </label>
            <input
              id={valueId}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor={whenId} className="text-small font-medium text-text-primary">
            When
          </label>
          <input
            id={whenId}
            type="datetime-local"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !subjectId}
          className="self-start rounded-md bg-action px-4 py-2 text-body font-medium text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save reading'}
        </button>
      </form>

      {single ? <VitalTrendCard trend={single.trend} label={KIND_LABEL[kind]} /> : null}
      {bp ? (
        <div className="flex flex-col gap-3">
          <VitalTrendCard trend={bp.trend.systolic} label="Blood pressure — systolic" />
          <VitalTrendCard trend={bp.trend.diastolic} label="Blood pressure — diastolic" />
        </div>
      ) : null}

      {kind === 'bp' ? (
        <div className="flex flex-col gap-3">
          <VitalChart points={systolicPoints} label="Systolic" unit="mmHg" />
          <VitalChart points={diastolicPoints} label="Diastolic" unit="mmHg" />
        </div>
      ) : (
        <VitalChart
          points={points}
          label={KIND_LABEL[kind]}
          unit={kind === 'weight' ? 'kg' : 'mg/dL'}
        />
      )}
    </section>
  );
}
