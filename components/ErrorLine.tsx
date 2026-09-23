import { Icon } from "./icons";

export function ErrorLine({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-danger-soft px-4 py-3 text-danger">
      <Icon name="warning" size={18} />
      <span className="tsm flex-1 text-danger">{message}</span>
      <button type="button" className="btn btn-s btn-sm" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        Try again
      </button>
    </div>
  );
}
