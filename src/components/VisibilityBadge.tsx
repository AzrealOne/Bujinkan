import type { Visibility } from "@prisma/client";
import { VISIBILITY_LABEL } from "@/lib/permissions";

const STYLE: Record<Visibility, string> = {
  PRIVATE: "bg-stone-100 text-stone-700",
  DOJO: "bg-amber-100 text-amber-800",
  COMMUNITY: "bg-emerald-100 text-emerald-800",
};

export function VisibilityBadge({ v }: { v: Visibility }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLE[v]}`}>
      {VISIBILITY_LABEL[v]}
    </span>
  );
}
