import { revalidateTag } from "next/cache";

/** Seconds to reuse admin list data (still refreshed after approvals). */
export const ADMIN_LIST_REVALIDATE = 30;

export function revalidateAdminListTags(...tags) {
  const list =
    tags.length > 0
      ? tags
      : [
          "admin-deposits",
          "admin-withdrawals",
          "admin-investments",
          "admin-users",
          "admin-metrics",
        ];
  for (const tag of list) {
    revalidateTag(tag);
  }
}
