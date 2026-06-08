interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
}

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4A2C1A]/50">
        {label}
      </span>
      {children}
    </div>
  );
}
