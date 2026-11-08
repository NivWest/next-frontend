'use client';

import { useId, useState, type FormEvent } from 'react';
import { MAX_WATCHLIST_NAME_LENGTH } from '../types';
import { validateWatchlistName } from '../watchlist';

export interface WatchlistNameFormProps {
  /** Text of the submit button, e.g. "Create list". */
  submitLabel: string;
  initialName?: string;
  /** Resolves when done; rejects with a message to show inline (the form stays open). */
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * "List name" input with submit and cancel, validated like the backend (1–50 characters after trimming).
 * Used to create (instrument page, watchlist page) and rename (watchlist page) lists.
 */
export function WatchlistNameForm({ submitLabel, initialName = '', onSubmit, onCancel }: WatchlistNameFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const invalid = validateWatchlistName(name);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={inputId} className="text-xs font-medium text-[#a1a1aa]">
        List name
      </label>
      <input
        id={inputId}
        type="text"
        value={name}
        autoFocus
        maxLength={MAX_WATCHLIST_NAME_LENGTH * 2}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onCancel();
          }
        }}
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-lg border border-[#27272a] bg-black px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-60"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#27272a] px-3 py-2 text-sm text-white hover:bg-[#27272a]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
