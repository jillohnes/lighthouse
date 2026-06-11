interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterField({ label, children, className = "" }: FilterFieldProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}
