import {
  LayoutDashboard,
  Layers,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Settings,
  Share2,
  ClipboardList,
  CreditCard,
} from "lucide-react";

export const userNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Plans", href: "/dashboard/plans", icon: Layers },
  { label: "Deposit", href: "/dashboard/deposit", icon: ArrowDownToLine },
  { label: "Withdraw", href: "/dashboard/withdraw", icon: ArrowUpFromLine },
  { label: "Referrals", href: "/dashboard/referrals", icon: Share2 },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
];

export const adminNav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Plans", href: "/admin/plans", icon: Layers },
  { label: "Deposits", href: "/admin/deposits", icon: ClipboardList },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: ArrowUpFromLine },
  { label: "Payment Methods", href: "/admin/methods", icon: CreditCard },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
