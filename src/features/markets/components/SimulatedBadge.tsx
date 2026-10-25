interface SimulatedBadgeProps {
  className?: string;
}

/** Pill marking prices from the deterministic simulated market (instruments with a `SIM-` id). */
export function SimulatedBadge({ className }: SimulatedBadgeProps) {
  return (
    <span
      title="Prices come from TradeEdu's deterministic simulator, not a real exchange"
      className={[
        'inline-flex shrink-0 items-center px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-[11px] font-semibold leading-none cursor-help',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      Simulated market data
    </span>
  );
}
