import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppsSubmissionDetails } from './AppsSubmissionDetails';
import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('AppsSubmissionDetails', () => {
  const baseSchema = {
    configuration: z.object({
      execSystemLogicalQueue: z.string(),
      allocation: z.string().optional(),
      reservation: z.string(),
    }),
    inputs: z.object({
      file: z.string(),
    }),
  };

  const baseFields = {
    configuration: {
      execSystemLogicalQueue: { label: 'Queue' },
      allocation: { label: 'Allocation' },
      reservation: { label: 'Reservation' },
    },
    inputs: {
      file: { label: 'Input File' },
    },
  };

  const baseDefinition = {
    notes: {
      hideQueue: false,
      hideAllocation: false,
      showReservation: true,
      isInteractive: false,
    },
  };

  vi.mock('react-hook-form', () => ({
    useFormContext: vi.fn(),
    useWatch: vi.fn(),
  }));

  it('should render successfully', () => {
    const baseElement = (props = {}) =>
      render(
        <AppsSubmissionDetails
          schema={baseSchema}
          fields={baseFields}
          isSubmitting={false}
          current="configuration"
          definition={baseDefinition}
          {...props}
        />
      );
    expect(baseElement).toBeTruthy();
  });

  it('hides reservation field when showReservation is false', () => {
    const formValues = {
      configuration: {
        reservation: 'my-reservation',
      },
    };

    (useFormContext as any).mockReturnValue({
      control: {},
      formState: {
        defaultValues: formValues,
        isValid: true,
      },
    });

    (useWatch as any).mockReturnValue(formValues);

    render(
      <AppsSubmissionDetails
        schema={baseSchema}
        fields={baseFields}
        isSubmitting={false}
        current="configuration"
        setCurrent={vi.fn()}
        definition={
          {
            notes: {
              showReservation: false,
              hideQueue: false,
              hideAllocation: false,
              isInteractive: false,
            },
          } as any
        }
      />
    );

    expect(screen.queryByText('Reservation')).toBeNull();
    expect(screen.queryByText('my-reservation')).toBeNull();
  });

  it('shows reservation field when showReservation is true', () => {
    const formValues = {
      configuration: {
        reservation: 'my-reservation',
      },
    };

    (useFormContext as any).mockReturnValue({
      control: {},
      formState: {
        defaultValues: formValues,
        isValid: true,
      },
    });

    (useWatch as any).mockReturnValue(formValues);

    render(
      <AppsSubmissionDetails
        schema={baseSchema}
        fields={baseFields}
        isSubmitting={false}
        current="configuration"
        setCurrent={vi.fn()}
        definition={baseDefinition}
      />
    );

    expect(screen.queryByText('Reservation')).toBeTruthy();
    expect(screen.queryByText('my-reservation')).toBeTruthy();
  });
});
