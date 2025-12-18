import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JobsDetailModalBody } from './JobsDetailModal';
import type { TTapisJob } from '@client/hooks';
import { getJobDisplayInformation } from '../utils/jobs';

vi.mock('../utils/jobs', () => ({
  getJobDisplayInformation: vi.fn(),
  getOutputPath: vi.fn(() => '/output/path'),
  getStatusText: vi.fn(() => 'Running'),
  isOutputState: vi.fn(() => true),
  isTerminalState: vi.fn(() => false),
  isInteractiveJob: vi.fn(() => false),
}));

vi.mock('../JobsListing/JobsListing', () => ({
  JobActionButton: () => <button>Action</button>,
}));

const mockGetJobDisplayInformation =
  getJobDisplayInformation as unknown as ReturnType<typeof vi.fn>;

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

describe('JobsDetailModalBody', () => {
  it('renders the reservation field when present', () => {
    mockGetJobDisplayInformation.mockReturnValue({
      appId: 'test.app',
      appVersion: '1.0',
      systemName: 'test-system',
      reservation: 'my-reservation',
      inputs: [],
      appArgs: [],
      envVars: [],
    });

    const jobData = {
      uuid: 'job-123',
      name: 'Test Job',
      execSystemId: 'exec-system',
      execSystemExecDir: '/exec/dir',
      archiveSystemId: 'archive-system',
      archiveSystemDir: '/archive/dir',
      appId: 'test.app',
      appVersion: '1.0',
    } as unknown as TTapisJob;

    render(<JobsDetailModalBody jobData={jobData} />);

    expect(screen.queryByText('Reservation')).toBeTruthy();
    expect(screen.queryByText('my-reservation')).toBeTruthy();
  });
});
