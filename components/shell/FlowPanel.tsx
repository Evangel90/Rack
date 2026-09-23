import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../icons";
import { ThemeToggle } from "../ThemeToggle";

/**
 * A flow screen (Save, Airtime, Review, status…).
 * Mobile: full screen with a back header and a sticky footer.
 * Desktop: a centred panel, as in the design's dialog frames.
 */
export function FlowPanel({
  title,
  step,
  back,
  backLabel = "Back",
  close,
  footer,
  width = 560,
  children,
}: {
  title: string;
  step?: string;
  back?: string;
  backLabel?: string;
  close?: string;
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="-mx-5 flex min-h-[calc(100dvh-36px)] flex-col bg-bg lg:mx-auto lg:my-4 lg:min-h-0 lg:w-full lg:overflow-hidden lg:rounded-3xl lg:bg-surface lg:shadow-[var(--shadow-lg)]"
      style={{ maxWidth: width }}
    >
      {/* Mobile header */}
      <header className="grid min-h-16 flex-none grid-cols-[52px_minmax(0,1fr)_52px] items-center px-1.5 lg:hidden">
        {back ? (
          <Link className="iconbtn" href={back} aria-label={backLabel}>
            <Icon name="chevronLeft" size={22} />
          </Link>
        ) : (
          <span />
        )}
        <div className="text-center">
          <h1 className="h3" style={{ fontSize: 17 }}>
            {title}
          </h1>
          {step && (
            <div className="txs" style={{ marginTop: 3 }}>
              {step}
            </div>
          )}
        </div>
        <span className="flex justify-end">
          <ThemeToggle />
        </span>
      </header>
      {/* Desktop header */}
      <header className="hidden items-center gap-2 px-5 pt-5 pb-2 lg:flex">
        {back && (
          <Link className="iconbtn" href={back} aria-label={backLabel}>
            <Icon name="chevronLeft" size={22} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="h2">{title}</h1>
          {step && (
            <div className="txs" style={{ marginTop: 4 }}>
              {step}
            </div>
          )}
        </div>
        {close && (
          <Link className="iconbtn" href={close} aria-label="Close">
            <Icon name="close" size={22} />
          </Link>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-[22px] px-5 pt-1 pb-6 lg:px-8 lg:pt-3">{children}</div>

      {footer && (
        <div className="sticky bottom-0 z-[4] flex flex-col gap-3 border-t border-line bg-surface px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] lg:static lg:px-8 lg:pt-5 lg:pb-7">
          {footer}
        </div>
      )}
    </section>
  );
}
