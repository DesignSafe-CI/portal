import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppsSubmissionDetails } from './AppsSubmissionDetails';
import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { TTapisApp } from '@client/hooks';
import type { TField } from '../AppsWizard/AppsFormSchema';

const field = (name: string, label: string): TField => ({
  name,
  label,
  key: name,
  type: 'string',
  required: true,
});

vi.mock('react-hook-form', () => ({
  useFormContext: vi.fn(),
  useWatch: vi.fn(),
}));

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
      execSystemLogicalQueue: field('execSystemLogicalQueue', 'Queue'),
      allocation: field('allocation', 'Allocation'),
      reservation: field('reservation', 'Reservation'),
    },
    inputs: {
      file: field('file', 'Input File'),
    },
  };

  const baseDefinition: TTapisApp = {
    sharedAppCtx: '',
    isPublic: false,
    sharedWithUsers: [],
    tenant: 'test',
    id: 'test.app',
    version: '1.0',
    description: '',
    owner: 'test-user',
    enabled: true,
    locked: false,
    runtime: 'SINGULARITY',
    runtimeOptions: [],
    containerImage: 'test.sif',
    jobType: 'BATCH',
    maxJobs: 1,
    maxJobsPerUser: 1,
    strictFileInputs: false,
    jobAttributes: {
      dynamicExecSystem: false,
      execSystemId: 'test-system',
      execSystemExecDir: '/exec',
      execSystemInputDir: '/input',
      execSystemOutputDir: '/output',
      execSystemLogicalQueue: 'normal',
      archiveSystemId: 'test-storage',
      archiveSystemDir: '/archive',
      archiveOnAppError: false,
      isMpi: false,
      mpiCmd: '',
      parameterSet: {
        appArgs: [],
        containerArgs: [],
        schedulerOptions: [],
        envVariables: [],
        archiveFilter: {
          includes: [],
          excludes: [],
          includeLaunchFiles: false,
        },
        logConfig: { stdoutFilename: 'stdout', stderrFilename: 'stderr' },
      },
      fileInputs: [],
      fileInputArrays: [],
      nodeCount: 1,
      coresPerNode: 1,
      memoryMB: 1024,
      maxMinutes: 10,
      subscriptions: [],
      tags: [],
    },
    tags: [],
    uuid: 'test-app',
    deleted: false,
    created: '2026-01-01T00:00:00Z',
    updated: '2026-01-01T00:00:00Z',
    notes: {
      hideQueue: false,
      hideAllocation: false,
      showReservation: true,
      isInteractive: false,
    },
  };

  it('should render successfully', () => {
    const baseElement = (props = {}) =>
      render(
        <AppsSubmissionDetails
          schema={baseSchema}
          fields={baseFields}
          isSubmitting={false}
          current="configuration"
          setCurrent={vi.fn<(step: string) => void>()}
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
        setCurrent={vi.fn<(step: string) => void>()}
        definition={{
          ...baseDefinition,
          notes: { ...baseDefinition.notes, showReservation: false },
        }}
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
        setCurrent={vi.fn<(step: string) => void>()}
        definition={baseDefinition}
      />
    );

    expect(screen.queryByText('Reservation')).toBeTruthy();
    expect(screen.queryByText('my-reservation')).toBeTruthy();
  });
});
