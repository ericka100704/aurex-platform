import { statusColor } from "@/lib/utils";

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusColor(status)}`}
    >
      {status}
    </span>
  );
}
