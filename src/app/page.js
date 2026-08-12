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
import { formatCurrency } from "@/lib/utils";

const NAV = [
  { label: "Plans", href: "#plans" },
  { label: "How It Works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Rewards", href: "#rewards" },
];

const PLANS = [
  {
    name: "AUREX START",
    description: "Beginner-Friendly Account",
    days: 8,
    min: 300,
    returnLabel: "25%",
    returnNote: "Total return",
  },
  {
    name: "AUREX PRO",
    description: "Advanced Trading Tools",
    days: 15,
    min: 3000,
    returnLabel: "50%",
    returnNote: "Total return",
  },
  {
    name: "AUREX ELITE",
    description: "Premium Platform Features",
    days: 25,
    min: 6000,
    returnLabel: "4%",
    returnNote: "Daily return",
  },
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
    text: "Send payment, upload your receipt, then wait for admin approval. Balance updates when approved.",
  },
  {
    step: "03",
    title: "Choose a plan & invest",
    text: "Pick AUREX START, PRO, or ELITE. Your investment is locked for the plan duration while returns grow.",
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
    text: "Deposits and withdrawals go through approval queues.",
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

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-dark">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/aurex-bg.png"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.38]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-dark/50" />
        <div className="absolute inset-x-0 top-[40%] h-72 bg-gradient-to-t from-gold/10 via-rose/5 to-transparent blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 pb-16 pt-5 md:px-8">
        <header className="sticky top-4 z-20 flex items-center justify-between gap-4 rounded-full border border-white/10 bg-[#121212]/95 px-4 py-3 md:px-6">
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
              className="rounded-full border-2 border-rose px-4 py-2 text-sm font-medium text-gold shadow-[0_0_14px_rgba(255,77,166,0.28)] transition hover:bg-rose/10"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-dark shadow-gold transition hover:scale-[1.02]"
            >
              Start Now
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center px-2 pb-10 pt-16 text-center md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center rounded-full border border-gold/30 bg-black/40 px-4 py-1.5 text-xs text-gold/90 backdrop-blur-md"
          >
            Trade · Grow · Succeed
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="aurex-title font-brand text-6xl md:text-8xl"
          >
            AUREX
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-5 max-w-xl text-sm text-white/60 md:text-base"
          >
            Your partner in global markets — GCash & GoTyme deposits, live plans,
            referral rewards, and admin-controlled rules.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/register"
              className="rounded-full bg-gold-gradient px-7 py-3 text-sm font-semibold text-dark shadow-[0_8px_28px_rgba(212,175,55,0.45)] transition hover:scale-[1.03] md:text-base"
            >
              Join AUREX Today
            </Link>
            <Link
              href="/login"
              className="rounded-full border-2 border-rose bg-black/30 px-7 py-3 text-sm font-medium text-gold shadow-[0_0_16px_rgba(255,77,166,0.3)] transition hover:bg-rose/10 md:text-base"
            >
              Sign in
            </Link>
          </motion.div>
        </section>

        {/* Plans */}
        <section id="plans" className="scroll-mt-28 py-14">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Plans</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Choose your growth path
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
              Three AUREX plans with clear duration, minimum deposit, and returns.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-gold/30 bg-black/45 p-5 backdrop-blur-md"
                style={{
                  boxShadow: "inset 0 0 0 1px rgba(255,77,166,0.12)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl text-gold">{plan.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wider text-rose/90">
                      {plan.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">
                    {plan.days} days
                  </span>
                </div>
                <p className="mt-5 text-sm text-white/60">Minimum Deposit</p>
                <p className="font-display text-2xl text-white">
                  {formatCurrency(plan.min)}
                </p>
                <div className="metallic-line my-4" />
                <p className="font-display text-3xl text-gold">{plan.returnLabel}</p>
                <p className="text-xs text-white/45">{plan.returnNote}</p>
                <Link
                  href="/register"
                  className="btn-gold mt-5 !w-full !rounded-full"
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-28 py-14">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">How It Works</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Simple path from deposit to earnings
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left"
              >
                <p className="font-brand text-sm tracking-[0.2em] text-rose">{item.step}</p>
                <h3 className="mt-2 font-display text-xl text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-28 py-14">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Features</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Built for modern investors
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-gold/20 bg-black/40 p-5 text-left"
                >
                  <div className="mb-3 inline-flex rounded-full border border-rose/35 bg-rose/10 p-2.5 text-rose">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/55">{feature.text}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Rewards */}
        <section id="rewards" className="scroll-mt-28 py-14">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">Rewards</p>
            <h2 className="mt-2 font-display text-3xl text-white md:text-4xl">
              Earn when your network grows
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
              Share your referral link and earn multi-level commissions when your
              downline deposits.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gold/30 bg-black/45 p-6 text-center">
              <Users className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 font-display text-3xl text-gold">8%</p>
              <p className="mt-1 text-sm text-white/70">Direct referral bonus</p>
              <p className="mt-2 text-xs text-white/40">Level 1 — your direct invites</p>
            </div>
            <div className="rounded-2xl border border-rose/30 bg-black/45 p-6 text-center">
              <BadgePercent className="mx-auto h-8 w-8 text-rose" />
              <p className="mt-3 font-display text-3xl text-rose">1%</p>
              <p className="mt-1 text-sm text-white/70">Downline commission</p>
              <p className="mt-2 text-xs text-white/40">Levels 2 to 4</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/45 p-6 text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 font-display text-3xl text-white">4</p>
              <p className="mt-1 text-sm text-white/70">Reward levels deep</p>
              <p className="mt-2 text-xs text-white/40">Paid from approved deposits</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/register"
              className="rounded-full bg-gold-gradient px-8 py-3 text-sm font-semibold text-dark shadow-gold"
            >
              Start Earning with AUREX
            </Link>
          </div>
        </section>

        <footer className="mt-8 border-t border-white/10 pt-8 text-center text-[11px] text-white/35">
          <p>© {new Date().getFullYear()} AUREX · Trade · Grow · Succeed</p>
          <p className="mt-2">
            Trading and investing involve risk. Invest responsibly.
          </p>
        </footer>
      </div>
    </div>
  );
}
