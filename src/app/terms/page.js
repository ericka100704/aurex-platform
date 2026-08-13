import LegalLayout from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Terms of Use · AUREX",
  description: "Terms of use for the AUREX investment platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Use" updated="14 August 2026">
      <p>
        These Terms govern your use of the AUREX website and dashboard
        (the &quot;Platform&quot;). By creating an account or using AUREX, you agree to
        these Terms, our Privacy Policy, and the Risk Disclosure.
      </p>
      <h2 className="font-display text-xl text-white">1. The Platform</h2>
      <p>
        AUREX is an online platform where registered users may deposit funds via
        supported Philippine e-wallets (including GCash, Maya, and GoTyme),
        allocate balances to time-based plans, earn referral commissions where
        enabled, and request withdrawals subject to Platform rules. AUREX is
        not a bank. Access may be limited, suspended, or terminated at our
        discretion for risk, compliance, or abuse.
      </p>
      <h2 className="font-display text-xl text-white">2. Accounts</h2>
      <p>
        You must provide accurate information and keep your password confidential.
        You are responsible for activity on your account. We may require email
        verification and may set accounts to ACTIVE, SUSPENDED, or BANNED.
        Suspended or banned users may lose access to deposits, investments, or
        withdrawals.
      </p>
      <h2 className="font-display text-xl text-white">3. Deposits</h2>
      <p>
        Manual deposits require a payment receipt and remain pending until an
        administrator reviews them. Automated checkout (for example PayMongo)
        credits only after the payment provider confirms a successful payment.
        Uploading a false receipt is grounds for rejection and account action.
        We may reverse credits made in error or obtained through fraud.
      </p>
      <h2 className="font-display text-xl text-white">4. Plans and returns</h2>
      <p>
        Plan duration, minimums, and displayed returns are set in the Platform
        and may change. Funds allocated to a plan are locked until the plan
        completes according to Platform rules. Displayed returns are Platform
        figures, not a guarantee of profit from any underlying market. See the
        Risk Disclosure.
      </p>
      <h2 className="font-display text-xl text-white">5. Withdrawals</h2>
      <p>
        Withdrawal requests are accepted only during the published window
        (default 6:00 AM–4:00 PM Asia/Manila) and are processed in a later
        batch after admin approval. Minimum withdrawal amounts apply. Approved
        withdrawals are paid to the account details you submit. We are not
        responsible for incorrect account numbers you provide.
      </p>
      <h2 className="font-display text-xl text-white">6. Referrals</h2>
      <p>
        Referral commissions, if enabled, are paid according to live system
        settings when a referred user&apos;s deposit is credited. Rates and depth
        may change. Abuse (self-referral, fake deposits, or circular networks)
        may forfeit commissions and result in a ban.
      </p>
      <h2 className="font-display text-xl text-white">7. Prohibited use</h2>
      <p>
        You may not use AUREX for fraud, money laundering, unauthorized access,
        or any illegal activity under Philippine law. We may cooperate with
        payment partners and authorities.
      </p>
      <h2 className="font-display text-xl text-white">8. Limitation of liability</h2>
      <p>
        To the fullest extent allowed by law, AUREX and its operators are not
        liable for lost profits, lost data, payment-provider outages, or delays
        in admin review. The Platform is provided &quot;as is.&quot;
      </p>
      <h2 className="font-display text-xl text-white">9. Changes</h2>
      <p>
        We may update these Terms. Continued use after changes are posted
        constitutes acceptance. If you do not agree, stop using the Platform
        and request withdrawal of any available balance subject to these Terms.
      </p>
      <h2 className="font-display text-xl text-white">10. Contact</h2>
      <p>
        Use the support email shown on your AUREX account or the contact
        details published on the Platform. These Terms are a Platform template
        and are not a substitute for advice from a Philippine lawyer.
      </p>
    </LegalLayout>
  );
}
