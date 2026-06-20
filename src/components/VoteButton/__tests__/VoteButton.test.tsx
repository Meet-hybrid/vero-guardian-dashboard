import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoteButton from '@/components/VoteButton';
import { castVote } from '@/services/contractClient';
import { useRole } from '@/context/RoleContext';
import { useToast } from '@/components/Toast';
import { appendAuditEvent } from '@/utils/logger';

const mockForceSync = jest.fn();

jest.mock('@/services/contractClient', () => ({
  castVote: jest.fn(),
}));
jest.mock('@/context/RoleContext', () => ({
  useRole: jest.fn(),
}));
jest.mock('@/context/NetworkContext', () => ({
  useNetwork: jest.fn(),
}));
jest.mock('@/components/Toast');
jest.mock('@/utils/logger', () => ({
  appendAuditEvent: jest.fn(() => Promise.resolve()),
}));

import { useNetwork } from '@/context/NetworkContext';

const mockCastVote = castVote as jest.MockedFunction<typeof castVote>;
const mockUseRole = useRole as jest.MockedFunction<typeof useRole>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseNetwork = useNetwork as jest.MockedFunction<typeof useNetwork>;
const mockAppendAuditEvent = appendAuditEvent as jest.MockedFunction<typeof appendAuditEvent>;
const mockShowToast = jest.fn();
const mockRefreshRole = jest.fn();

type MockRoleState = ReturnType<typeof useRole>;

function mockRole(overrides: Partial<MockRoleState> = {}): void {
  mockUseRole.mockReturnValue({
    role: 'guardian',
    isAdmin: false,
    isGuardian: true,
    canVote: true,
    canManageTasks: false,
    isLoading: false,
    error: null,
    refreshRole: mockRefreshRole,
    ...overrides,
  });
}

function renderVoteButton(publicKey: string | null = 'GPUBKEY'): HTMLElement {
  render(<VoteButton prId={42} publicKey={publicKey} />);
  return screen.getByRole('button');
}

beforeEach(() => {
  mockUseToast.mockReturnValue({ showToast: mockShowToast });
  mockUseNetwork.mockReturnValue({
    networkConfig: {
      horizonUrl: 'https://horizon-testnet.stellar.org',
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
      networkPassphrase: 'Test SDF Network ; September 2015',
    },
    isCustomConfig: false,
    setHorizonUrl: jest.fn(),
    setSorobanRpcUrl: jest.fn(),
    setNetworkPassphrase: jest.fn(),
    resetToDefaults: jest.fn(),
  });
  mockRole();
  mockCastVote.mockResolvedValue('deafhash');
  mockForceSync.mockResolvedValue(undefined);
});

afterEach(() => jest.clearAllMocks());

describe('VoteButton', () => {
  it('lets a connected authorized role cast a vote', async () => {
    mockRole({
      role: 'admin',
      isAdmin: true,
      isGuardian: false,
      canManageTasks: true,
    });

    const button = renderVoteButton();

    expect(button).toBeEnabled();
    fireEvent.click(button);

    await waitFor(() => expect(mockCastVote).toHaveBeenCalledWith(42, 'GPUBKEY', expect.any(String), expect.any(String)));
    await waitFor(() =>
      expect(mockAppendAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'vote-42-deafhash',
          type: 'guardian.vote',
          action: 'vote_submitted',
          status: 'success',
        }),
      ),
    );
  });

  it('is disabled when no wallet is connected', () => {
    const button = renderVoteButton(null);

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockCastVote).not.toHaveBeenCalled();
  });

  it('is disabled for an unauthorized role and does not vote', () => {
    mockRole({
      role: 'unauthorized',
      isGuardian: false,
      canVote: false,
    });

    const button = renderVoteButton();

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockCastVote).not.toHaveBeenCalled();
  });

  it('is disabled while role data is loading', () => {
    mockRole({ isLoading: true, canVote: true });

    expect(renderVoteButton()).toBeDisabled();
  });

  it('shows success toast and disables after a successful vote', async () => {
    const button = renderVoteButton();
    fireEvent.click(button);

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('Vote recorded'), 'success')
    );
    expect(button).toBeDisabled();
  });

  it('shows generic error toast for vote failures', async () => {
    mockCastVote.mockRejectedValue(new Error('Horizon error'));
    const button = renderVoteButton();
    fireEvent.click(button);

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('Horizon error', 'error'));
    expect(mockAppendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'guardian.vote',
        action: 'vote_failed',
        status: 'failure',
      }),
    );
  });
});
