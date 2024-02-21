import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren } from 'react';
import {
  DataEditingContextType,
  KeyValue,
} from '../data-editing-context/data-editing-context-provider';
import { useWizardContext } from './use-wizard-context';
import { WizardContextType } from './wizard-context-provider';
import { withWizardContext } from './with-wizard-context';

vi.mock('../data-editing-context/use-data-editing-context', () => ({
  useDataEditingContext: (): DataEditingContextType => ({
    editing: false,
    updates: {},
    handleChange: vi.fn(),
    openEditMode: vi.fn(),
    cancelEditMode: vi.fn(),
  }),
}));

let mockValues: KeyValue;
let mockStepIndex: number;
const mockHandleChange = vi.fn();
const mockPrevStep = vi.fn();
const mockNextStep = vi.fn();
const mockReset = vi.fn();

vi.mock('./use-wizard-context', () => ({
  useWizardContext: (): WizardContextType => ({
    values: mockValues,
    handleChange: mockHandleChange,
    stepIndex: mockStepIndex,
    prevStep: mockPrevStep,
    nextStep: mockNextStep,
    reset: mockReset,
  }),
}));

const combineValuesIntoList = (values: KeyValue) => {
  return Object.entries(values)
    .map(([k, v]) => `${k}:${v as string}`)
    .join(';');
};

function WrappedComponent({ children }: PropsWithChildren) {
  const { values, handleChange, stepIndex, prevStep, nextStep, reset } =
    useWizardContext();
  return (
    <>
      <div data-testid="values">{combineValuesIntoList(values)}</div>
      <button
        data-testid="handle-change"
        type="button"
        onClick={() => handleChange('x', 'y')}
      />
      <div data-testid="step-index">{stepIndex.toString()}</div>
      <button
        data-testid="prev-step"
        type="button"
        onClick={() => prevStep()}
      />
      <button
        data-testid="next-step"
        type="button"
        onClick={() => nextStep()}
      />
      <button data-testid="reset" type="button" onClick={() => reset()} />
      {children}
    </>
  );
}

const TestComponent = withWizardContext(WrappedComponent);

describe(withWizardContext.name, () => {
  beforeEach(() => {
    mockValues = { foo: 'bar' };
    mockStepIndex = -1;
  });

  it('should render the children', () => {
    const childText = 'Hello';

    render(
      <TestComponent>
        <div>{childText}</div>
      </TestComponent>,
    );

    const child = screen.getByText(childText);
    expect(child).toBeInTheDocument();
  });

  it('should provide access to a wizard context', async () => {
    const user = userEvent.setup();

    render(<TestComponent />);

    const values = screen.getByTestId('values').innerHTML;
    expect(values).toEqual(combineValuesIntoList(mockValues));

    const handleChange = screen.getByTestId('handle-change');
    await user.click(handleChange);
    await waitFor(() => expect(mockHandleChange).toHaveBeenCalledOnce());

    const stepIndex = screen.getByTestId('step-index').innerHTML;
    expect(stepIndex).toEqual(mockStepIndex.toString());

    const prevStep = screen.getByTestId('prev-step');
    await user.click(prevStep);
    await waitFor(() => expect(mockPrevStep).toHaveBeenCalledOnce());

    const nextStep = screen.getByTestId('next-step');
    await user.click(nextStep);
    await waitFor(() => expect(mockNextStep).toHaveBeenCalledOnce());

    const reset = screen.getByTestId('reset');
    await user.click(reset);
    await waitFor(() => expect(mockReset).toHaveBeenCalledOnce());
  });
});