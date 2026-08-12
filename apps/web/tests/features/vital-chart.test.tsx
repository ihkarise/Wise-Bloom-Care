/**
 * VitalChart accessibility test (docs/03-UX/40, docs/20-Implementation/207 §9
 * a11y): the chart exposes a factual image label AND an equivalent data-table
 * alternative, so meaning never depends on the visual alone.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VitalChart from '../../src/features/vitals/VitalChart';

describe('VitalChart', () => {
  it('renders an accessible image label and a data-table alternative', () => {
    render(
      <VitalChart
        label="Weight"
        unit="kg"
        points={[
          { value: 60, at: '2026-03-01T00:00:00.000Z' },
          { value: 61, at: '2026-03-08T00:00:00.000Z' },
        ]}
      />,
    );
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('Weight');
    // The exact readings are available as a table alternative.
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  it('renders a calm empty state with no chart when there are no readings', () => {
    render(<VitalChart label="Weight" unit="kg" points={[]} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(/no readings to chart yet/i)).toBeTruthy();
  });
});
