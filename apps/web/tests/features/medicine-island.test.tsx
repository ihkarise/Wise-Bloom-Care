/**
 * MedicineIslandView tests (docs/20-Implementation/208 §9 frontend + a11y).
 * The view is presentational (props only), so these cover render, list,
 * active/stopped state, add, edit, stop (with confirmation), restart, and the
 * empty/loading/error states without needing session or network mocks.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  MedicineIslandView,
  type MedicineIslandViewProps,
} from '../../src/features/medicines/MedicineIsland';

import type { Medicine } from '@wise-bloom/domain-types';

const IRON: Medicine = {
  med_id: 'med-iron',
  subject_id: 'maternal-1',
  name: 'Iron tablet',
  schedule: 'Every morning',
  active: true,
};

const OLD: Medicine = {
  med_id: 'med-old',
  subject_id: 'maternal-1',
  name: 'Old supplement',
  schedule: 'As needed',
  active: false,
};

function baseProps(overrides: Partial<MedicineIslandViewProps> = {}): MedicineIslandViewProps {
  return {
    medicines: [],
    loading: false,
    loadError: null,
    actionError: null,
    confirmation: null,
    subjectReady: true,
    submitting: false,
    busyId: null,
    onAdd: vi.fn(async () => true),
    onSaveEdit: vi.fn(async () => true),
    onStop: vi.fn(async () => true),
    onRestart: vi.fn(async () => true),
    ...overrides,
  };
}

describe('MedicineIslandView', () => {
  it('renders a labelled section, the add form, and accessible fields', () => {
    const { container } = render(<MedicineIslandView {...baseProps()} />);
    expect(screen.getByRole('heading', { name: 'Medicines' })).toBeTruthy();
    expect(container.querySelector('section[aria-labelledby="medicines-heading"]')).toBeTruthy();
    // Labels are associated with their inputs (accessibility).
    expect(screen.getByLabelText('Medicine name')).toBeTruthy();
    expect(screen.getByLabelText('Schedule')).toBeTruthy();
  });

  it('shows a calm empty state when there are no medicines', () => {
    render(<MedicineIslandView {...baseProps()} />);
    expect(screen.getByText('No medicines yet')).toBeTruthy();
  });

  it('shows a loading indicator while loading', () => {
    render(<MedicineIslandView {...baseProps({ loading: true })} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
    // The empty state is not shown while loading.
    expect(screen.queryByText('No medicines yet')).toBeNull();
  });

  it('shows the list error as an alert', () => {
    render(
      <MedicineIslandView {...baseProps({ loadError: 'We couldn’t load your medicines.' })} />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('couldn’t load');
  });

  it('shows an action error and a confirmation with the right roles', () => {
    const { rerender } = render(
      <MedicineIslandView {...baseProps({ actionError: 'Please check the fields.' })} />,
    );
    expect(screen.getByRole('alert').textContent).toContain('Please check');

    rerender(<MedicineIslandView {...baseProps({ confirmation: 'Added to your medicines.' })} />);
    expect(screen.getByRole('status').textContent).toContain('Added to your medicines.');
  });

  it('lists active and stopped medicines with the correct headings and badges', () => {
    render(<MedicineIslandView {...baseProps({ medicines: [IRON, OLD] })} />);
    expect(screen.getByText('Iron tablet')).toBeTruthy();
    expect(screen.getByText('Every morning')).toBeTruthy();
    expect(screen.getByText('Old supplement')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Currently taking' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Stopped' })).toBeTruthy();
    expect(screen.getByText('1 active medicine')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('disables Add until the subject is ready and both fields are filled', () => {
    const { rerender } = render(<MedicineIslandView {...baseProps({ subjectReady: false })} />);
    const button = screen.getByRole('button', { name: 'Add medicine' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    rerender(<MedicineIslandView {...baseProps({ subjectReady: true })} />);
    // Fields still empty → still disabled.
    expect(
      (screen.getByRole('button', { name: 'Add medicine' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('adds a medicine with the typed name and schedule, then clears the form', async () => {
    const onAdd = vi.fn(async () => true);
    render(<MedicineIslandView {...baseProps({ onAdd })} />);

    const nameInput = screen.getByLabelText('Medicine name') as HTMLInputElement;
    const scheduleInput = screen.getByLabelText('Schedule') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: '  Iron tablet  ' } });
    fireEvent.change(scheduleInput, { target: { value: 'Every morning' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add medicine' }));

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({ name: 'Iron tablet', schedule: 'Every morning' }),
    );
    // On success the inputs are cleared.
    await waitFor(() => expect(nameInput.value).toBe(''));
    expect(scheduleInput.value).toBe('');
  });

  it('edits a medicine inline and saves the changes', async () => {
    const onSaveEdit = vi.fn(async () => true);
    render(<MedicineIslandView {...baseProps({ medicines: [IRON], onSaveEdit })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const scheduleInput = screen.getByDisplayValue('Every morning') as HTMLInputElement;
    fireEvent.change(scheduleInput, { target: { value: 'Twice daily with food' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(onSaveEdit).toHaveBeenCalledWith('med-iron', {
        name: 'Iron tablet',
        schedule: 'Twice daily with food',
      }),
    );
  });

  it('stops a medicine only after confirmation', async () => {
    const onStop = vi.fn(async () => true);
    render(<MedicineIslandView {...baseProps({ medicines: [IRON], onStop })} />);

    // First click asks for confirmation — it must not stop yet.
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).not.toHaveBeenCalled();
    expect(screen.getByText(/Stop taking this medicine\?/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Yes, stop' }));
    await waitFor(() => expect(onStop).toHaveBeenCalledWith('med-iron'));
  });

  it('cancels a stop when "Keep taking" is chosen', () => {
    const onStop = vi.fn(async () => true);
    render(<MedicineIslandView {...baseProps({ medicines: [IRON], onStop })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep taking' }));
    expect(onStop).not.toHaveBeenCalled();
    // Back to the normal actions.
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy();
  });

  it('restarts a stopped medicine', async () => {
    const onRestart = vi.fn(async () => true);
    render(<MedicineIslandView {...baseProps({ medicines: [OLD], onRestart })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start again' }));
    await waitFor(() => expect(onRestart).toHaveBeenCalledWith('med-old'));
  });

  it('scopes stop confirmation to the chosen row', () => {
    const second: Medicine = { ...IRON, med_id: 'med-2', name: 'Calcium' };
    render(<MedicineIslandView {...baseProps({ medicines: [IRON, second] })} />);
    const ironRow = screen.getByText('Iron tablet').closest('li') as HTMLElement;
    fireEvent.click(within(ironRow).getByRole('button', { name: 'Stop' }));
    // Only the iron row shows the confirmation prompt.
    expect(within(ironRow).getByText(/Stop taking this medicine\?/)).toBeTruthy();
    const calciumRow = screen.getByText('Calcium').closest('li') as HTMLElement;
    expect(within(calciumRow).queryByText(/Stop taking this medicine\?/)).toBeNull();
  });
});
