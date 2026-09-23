export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className="inline-flex items-center" style={{ gap: lg ? 9 : 8 }}>
      <svg width={lg ? 28 : 24} height={lg ? 28 : 24} viewBox="0 0 32 32" aria-hidden="true" className="block flex-none">
        <rect width="32" height="32" rx="9" style={{ fill: "var(--accent)" }} />
        <rect x="7" y="19.5" width="18" height="4.6" rx="2.3" fill="#1C1813" />
        <rect x="7" y="13.4" width="18" height="4.6" rx="2.3" fill="#1C1813" />
        <rect x="7" y="7.3" width="11" height="4.6" rx="2.3" fill="#1C1813" />
      </svg>
      <span
        style={{
          font: `800 ${lg ? 33 : 28}px/1 var(--display)`,
          letterSpacing: "-0.05em",
          color: "var(--ink)",
          paddingBottom: lg ? 3 : 2,
        }}
      >
        rack
      </span>
    </span>
  );
}
