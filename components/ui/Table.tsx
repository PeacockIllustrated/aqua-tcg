import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({
  children,
  className = "",
  scrollHint = true,
  ...rest
}: HTMLAttributes<HTMLTableElement> & {
  children: ReactNode;
  /** Phones: edge fade + "swipe" caption for wide tables that scroll
   *  sideways. Turn off for tables that reflow to fit. */
  scrollHint?: boolean;
}) {
  return (
    <div className="max-w-full min-w-0">
      <div className="relative">
        <div className="max-w-full min-w-0 border-[3px] border-ink rounded-md overflow-x-auto bg-paper-strong shadow-[3px_3px_0_0_var(--color-ink)]">
          <table
            {...rest}
            className={`w-full border-collapse text-[13px] font-sans tabular-nums ${className}`.trim()}
          >
            {children}
          </table>
        </div>
        {scrollHint ? (
          <div
            aria-hidden="true"
            className="md:hidden pointer-events-none absolute right-[3px] top-[3px] bottom-[3px] w-8 rounded-r-md bg-gradient-to-l from-ink/20 to-transparent"
          />
        ) : null}
      </div>
      {scrollHint ? (
        <p aria-hidden="true" className="md:hidden mt-1.5 text-right font-display text-[9px] tracking-wider text-muted">
          Swipe for more →
        </p>
      ) : null}
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-ink text-paper-strong">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & { children: ReactNode }) {
  return (
    <tr {...rest} className={`border-b-2 border-ink/15 last:border-0 hover:bg-highlight/15 ${className}`.trim()}>
      {children}
    </tr>
  );
}

export function TH({
  children,
  className = "",
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <th
      {...rest}
      className={`text-left px-3 py-2.5 font-display text-[11px] tracking-wider ${className}`.trim()}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className = "",
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td {...rest} className={`px-3 py-2.5 align-top ${className}`.trim()}>
      {children}
    </td>
  );
}
