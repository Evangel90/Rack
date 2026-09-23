import Link from "next/link";
import { Icon } from "../icons";
import { ThemeToggle } from "../ThemeToggle";

/** Back header for mobile screens that aren't tab pages (desktop uses the sidebar). */
export function MobileBackHeader({ title, back = "/home" }: { title?: string; back?: string }) {
  return (
    <header className="-mx-5 grid min-h-16 flex-none grid-cols-[52px_minmax(0,1fr)_52px] items-center px-1.5 lg:hidden">
      <Link className="iconbtn" href={back} aria-label="Back">
        <Icon name="chevronLeft" size={22} />
      </Link>
      <div className="text-center">{title && <span className="h3 text-[17px]">{title}</span>}</div>
      <span className="flex justify-end">
        <ThemeToggle />
      </span>
    </header>
  );
}
