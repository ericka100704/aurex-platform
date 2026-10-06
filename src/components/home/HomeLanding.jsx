"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Wallet,
  TrendingUp,
  Users,
  Clock3,
  BadgePercent,
  Smartphone,
  Lock,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { formatCurrency, formatPercent } from "@/lib/utils";

const NAV = [
  { label: "Plans", href: "#plans" },
  { label: "How It Works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Rewards", href: "#rewards" },
];

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    text: "Register in minutes. No KYC required to start. Use a referral code if you have one.",
  },
  {
    step: "02",
    title: "Deposit via GCash or GoTyme",
    text: "Send payment, upload your receipt, and wait for admin approval. Your balance credits after review.",
  },
  {
    step: "03",
    title: "Choose a plan & invest",
    text: "Pick a live plan. Your investment is locked for the plan duration while returns grow.",
  },
  {
    step: "04",
    title: "Withdraw your earnings",
    text: "Request withdrawals between 6:00 AM–4:00 PM (Asia/Manila). Release processing batch runs at 9:00 PM.",
  },
];

const FEATURES = [
  {
    icon: Smartphone,
    title: "GCash & GoTyme",
    text: "Deposit with payment methods managed live by admin.",
  },
  {
    icon: TrendingUp,
    title: "Live investment plans",
    text: "Dynamic plans with clear duration, minimums, and returns.",
  },
  {
    icon: ShieldCheck,
    title: "Admin-controlled security",
    text: "Deposits and withdrawals go through an admin approval queue.",
  },
  {
    icon: Clock3,
    title: "Clear withdrawal window",
    text: "Requests accepted 6 AM–4 PM; batch release at 9 PM.",
  },
  {
    icon: Wallet,
    title: "Transparent wallet",
    text: "Balance moves only through deposits, invest, rewards, and withdraw.",
  },
  {
    icon: Lock,
    title: "Protected accounts",
    text: "Status controls for ACTIVE, SUSPENDED, and BANNED users.",
  },
];

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

function Reveal({ children, className = "", delay = 0, as: Tag = motion.div, ...props }) {
  return (
    <Tag
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.65, ease, delay }}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default function HomeLanding({ plans = [], rewards }) {
  const direct = rewards?.direct ?? 8;
  const level = rewards?.level ?? 1;
  const maxLevel = rewards?.maxLevel ?? 4;

  return (
    <div className="relative min-h-dvh bg-[#0d0d0d]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/solana-bg.png"
          alt=""
          fill
          priority
          quality={50}
          className="object-cover opacity-[0.22]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0d0d0d]/55" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 px-5 pt-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-[#121212]/92 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md md:px-6">
          <Logo size="sm" />
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-white/65 transition hover:text-gold"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border-2 border-rose px-4 py-2 text-sm font-medium text-gold shadow-[0_0_14px_rgba(168,85,247,0.28)] transition hover:bg-rose/10"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-white shadow-gold"
            >
              Start Now
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col overflow-x-hidden px-5 pb-16 pt-24 md:px-8 md:pt-28">
        <motion.section
          className="flex min-h-[calc(100dvh-6.5rem)] flex-col items-center px-2 pb-20 pt-6 text-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mb-10 inline-flex items-center rounded-full border border-gold/30 bg-black/40 px-5 py-2 text-sm text-gold/90 md:mb-12 md:text-base"
          >
            Trade · Grow · Succeed
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease }}
            className="brand-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
          >
            SOLANA
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.65, ease }}
            className="mt-10 max-w-2xl text-base leading-relaxed text-white/65 sm:mt-12 sm:text-lg md:text-xl"
          >
            Your partner in global markets — GCash & GoTyme deposits, live plans,
            referral rewards, and admin-controlled rules.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.65, ease }}
            className="mt-12 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mt-14 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Link
              href="/register"
              className="rounded-full bg-gold-gradient px-7 py-3 text-center text-sm font-semibold text-white shadow-[0_8px_28px_rgba(124,58,237,0.45)] md:text-base"
            >
              Join SOLANA Today
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-rose bg-black/30 px-7 py-3 text-center text-sm font-medium text-gold md:text-base"
            >
              Sign in
            </Link>
          </motion.div>
        </motion.section>

        <section id="plans" className="scroll-mt-28 py-14">
          <Reveal className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Plans</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Choose your growth path
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
              Live plans from the platform — same duration, minimums, and returns as
              your dashboard.
            </p>
          </Reveal>
          {plans.length === 0 ? (
            <Reveal>
              <p className="text-center text-sm text-white/45">
                No active plans yet. Check back soon.
              </p>
            </Reveal>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan, i) => (
                <Reveal
                  key={plan.id}
                  delay={i * 0.1}
                  className="rounded-2xl border border-gold/30 bg-black/45 p-5"
                  style={{
                    boxShadow: "inset 0 0 0 1px rgba(168,85,247,0.12)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl text-gold">{plan.name}</h3>
                      <p className="mt-1 text-xs uppercase tracking-wider text-rose/90">
                        {plan.description || "Investment plan"}
                      </p>
                    </div>
                    <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">
                      {plan.durationDays} days
                    </span>
                  </div>
                  <p className="mt-5 text-sm text-white/60">Minimum Deposit</p>
                  <p className="font-display text-2xl text-white">
                    {formatCurrency(plan.minAmount)}
                  </p>
                  <div className="metallic-line my-4" />
                  <p className="font-display text-3xl text-gold">
                    {formatPercent(plan.totalReturnPct)}
                  </p>
                  <p className="text-xs text-white/45">
                    Total return · {formatPercent(plan.dailyReturnPct)} daily
                  </p>
                  <Link
                    href="/register"
                    className="btn-gold mt-5 !w-full !rounded-full"
                  >
                    Get Started
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </section>

        <section id="how" className="scroll-mt-28 py-14">
          <Reveal className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">How It Works</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Simple path from deposit to earnings
            </h2>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-2">
            {STEPS.map((item, i) => (
              <Reveal
                key={item.step}
                delay={i * 0.08}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left"
              >
                <p className="text-sm font-semibold text-rose">{item.step}</p>
                <h3 className="mt-2 font-display text-xl text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{item.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-28 py-14">
          <Reveal className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Features</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Built for modern investors
            </h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal
                  key={feature.title}
                  delay={i * 0.07}
                  className="rounded-2xl border border-gold/20 bg-black/40 p-5 text-left"
                >
                  <div className="mb-3 inline-flex rounded-full border border-rose/35 bg-rose/10 p-2.5 text-rose">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/55">{feature.text}</p>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section id="rewards" className="scroll-mt-28 py-14">
          <Reveal className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Rewards</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Earn when your network grows
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
              Share your referral link and earn multi-level commissions when your
              downline deposits.
            </p>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            <Reveal
              delay={0}
              className="rounded-2xl border border-gold/30 bg-black/45 p-6 text-center"
            >
              <Users className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 font-display text-3xl text-gold">
                {formatPercent(direct).replace(".00", "")}
              </p>
              <p className="mt-1 text-sm text-white/70">Direct referral bonus</p>
              <p className="mt-2 text-xs text-white/40">Level 1 — your direct invites</p>
            </Reveal>
            <Reveal
              delay={0.1}
              className="rounded-2xl border border-rose/30 bg-black/45 p-6 text-center"
            >
              <BadgePercent className="mx-auto h-8 w-8 text-rose" />
              <p className="mt-3 font-display text-3xl text-rose">
                {formatPercent(level).replace(".00", "")}
              </p>
              <p className="mt-1 text-sm text-white/70">Downline commission</p>
              <p className="mt-2 text-xs text-white/40">
                Levels 2 to {maxLevel}
              </p>
            </Reveal>
            <Reveal
              delay={0.2}
              className="rounded-2xl border border-white/10 bg-black/45 p-6 text-center"
            >
              <TrendingUp className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 font-display text-3xl text-white">{maxLevel}</p>
              <p className="mt-1 text-sm text-white/70">Reward levels deep</p>
              <p className="mt-2 text-xs text-white/40">Paid from every deposit</p>
            </Reveal>
          </div>
          <Reveal className="mt-8 text-center" delay={0.15}>
            <Link
              href="/register"
              className="rounded-full bg-gold-gradient px-8 py-3 text-sm font-semibold text-white shadow-gold"
            >
              Start Earning with SOLANA
            </Link>
          </Reveal>
        </section>

        <Reveal
          as={motion.footer}
          className="mt-8 border-t border-white/10 pt-8 text-center text-[11px] text-white/35"
        >
          <p>© {new Date().getFullYear()} SOLANA · Trade · Grow · Succeed</p>
          <p className="mt-2">
            Trading and investing involve risk. Invest responsibly.
          </p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href="/terms" className="hover:text-gold">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-gold">
              Privacy
            </Link>
            <Link href="/risk" className="hover:text-gold">
              Risk disclosure
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  );
}
