import { render, screen, fireEvent } from '@testing-library/react';

import TaskCard, { matchesFilter, type TaskCardTask } from '@/components/TaskCard';

let _searchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useSearchParams: () => _searchParams,
  useRouter: () => ({
    replace: (url: string) => {
      const qs = url.includes('?') ? url.split('?')[1] : '';
      _searchParams = new URLSearchParams(qs);
    },
  }),
  usePathname: () => '/',
}));

function createTask(overrides: Partial<TaskCardTask> = {}): TaskCardTask {
  return {
    id: 'task-1',
    title: 'Review validator evidence',
    status: 'pending',
    is_done: false,
    reward: '25 VERO',
    priority: 'high',
    ...overrides,
  };
}

describe('matchesFilter', () => {
  it('returns true when both filters are "all"', () => {
    const task = createTask();
    expect(matchesFilter(task, 'all', 'all')).toBe(true);
  });

  it('filters by status', () => {
    const task = createTask({ status: 'completed', is_done: true });
    expect(matchesFilter(task, 'completed', 'all')).toBe(true);
    expect(matchesFilter(task, 'pending', 'all')).toBe(false);
  });

  it('filters by priority', () => {
    const task = createTask({ priority: 'high' });
    expect(matchesFilter(task, 'all', 'high')).toBe(true);
    expect(matchesFilter(task, 'all', 'low')).toBe(false);
  });

  it('combines status and priority filters', () => {
    const task = createTask({ status: 'pending', is_done: false, priority: 'high' });
    expect(matchesFilter(task, 'pending', 'high')).toBe(true);
    expect(matchesFilter(task, 'pending', 'low')).toBe(false);
    expect(matchesFilter(task, 'completed', 'high')).toBe(false);
  });

  it('resolves is_done as completed', () => {
    const task = createTask({ status: 'pending', is_done: true });
    expect(matchesFilter(task, 'completed', 'all')).toBe(true);
    expect(matchesFilter(task, 'pending', 'all')).toBe(false);
  });
});

describe('TaskCard', () => {
  beforeEach(() => {
    _searchParams = new URLSearchParams();
  });

  it('renders a pending task title and action button from payload data', () => {
    render(<TaskCard tasks={[createTask()]} />);

    expect(screen.getByText('Review validator evidence')).toBeInTheDocument();
    expect(screen.getByText('25 VERO')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /vote for review validator evidence/i })
    ).toBeInTheDocument();
  });

  it('removes the Vote action when the task is already done', () => {
    render(
      <TaskCard
        tasks={[
          createTask({
            status: 'pending',
            is_done: true,
            title: 'Completed validator review',
          }),
        ]}
      />
    );

    expect(screen.getByText('Completed validator review')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /vote/i })).not.toBeInTheDocument();
  });

  it('renders filter controls', () => {
    render(<TaskCard tasks={[]} />);

    expect(screen.getByRole('group', { name: /filter tasks by status/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /filter tasks by priority/i })).toBeInTheDocument();
  });

  it('applies URL search param filters on render', () => {
    _searchParams = new URLSearchParams('status=completed');

    const tasks = [
      createTask({ id: '1', title: 'Pending task', status: 'pending', is_done: false }),
      createTask({ id: '2', title: 'Completed task', status: 'completed', is_done: true }),
    ];
    const { rerender } = render(<TaskCard tasks={tasks} />);

    expect(screen.queryByText('Pending task')).not.toBeInTheDocument();
    expect(screen.getByText('Completed task')).toBeInTheDocument();

    _searchParams = new URLSearchParams();
    rerender(<TaskCard tasks={tasks} />);
    expect(screen.getByText('Pending task')).toBeInTheDocument();
  });

  it('shows no results message when filters match nothing', () => {
    _searchParams = new URLSearchParams('status=completed');

    render(
      <TaskCard
        tasks={[createTask({ id: '1', title: 'Only pending task', status: 'pending', is_done: false })]}
      />
    );

    expect(screen.getByText(/no tasks match/i)).toBeInTheDocument();
  });

  it('shows clear filters link when filter is active', () => {
    _searchParams = new URLSearchParams('status=completed');

    render(<TaskCard tasks={[createTask()]} />);

    expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
  });

  it('clears filters via router replace when clear is clicked', () => {
    _searchParams = new URLSearchParams('status=completed');

    render(<TaskCard tasks={[createTask({ id: '1', title: 'A task' })]} />);

    fireEvent.click(screen.getByText(/clear filters/i));
    expect(_searchParams.toString()).toBe('');
  });
});
