import LegalLayout from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Risk Disclosure · AUREX",
  description: "Risks of using AUREX plans, deposits, and withdrawals.",
};

export default function RiskPage() {
  return (
    <LegalLayout title="Risk Disclosure" updated="14 August 2026">
      <p>
        Using AUREX involves significant risk. You can lose money. Do not
        deposit funds you cannot afford to lose. This is not investment,
        tax, or legal advice. AUREX is not the Bangko Sentral ng Pilipinas
        and is not a substitute for a licensed bank, broker, or investment
        house unless we separately hold and disclose such a license.
      </p>
      <h2 className="font-display text-xl text-white">1. Capital risk</h2>
      <p>
        Balances on the Platform are operational balances, not insured
        deposits. Plan lock-ups mean you cannot withdraw allocated funds until
        a plan completes under Platform rules. Delays, freezes, or losses can
        occur due to operational, technical, or payment issues.
      </p>
      <h2 className="font-display text-xl text-white">2. Displayed returns</h2>
      <p>
        Percentages shown on plans (daily or total) are Platform parameters.
        They are not a promise of profit from stocks, FX, or any live market.
        Past or advertised figures do not guarantee future results. High
        advertised yields are inherently risky.
      </p>
      <h2 className="font-display text-xl text-white">3. Liquidity and withdrawals</h2>
      <p>
        Withdrawals depend on the daily request window, admin approval, and
        successful payout to your e-wallet. Requests can be delayed or
        rejected. Network or partner outages can postpone release.
      </p>
      <h2 className="font-display text-xl text-white">4. Operational and counterparty risk</h2>
      <p>
        The Platform relies on hosting, databases, and payment partners.
        Outages, errors, or partner restrictions can interrupt deposits,
        credits, or payouts. Referral income depends on other users&apos;
        activity and can stop if rules change.
      </p>
      <h2 className="font-display text-xl text-white">5. Regulatory risk</h2>
      <p>
        Rules for online platforms, e-wallets, and investments in the
        Philippines may change. We may pause products, require extra
        verification, or limit features to follow law or partner policies
        (including PayMongo and e-wallet networks).
      </p>
      <h2 className="font-display text-xl text-white">6. Your responsibility</h2>
      <p>
        You decide whether AUREX is appropriate for you. Read the Terms and
        Privacy Policy. If you do not understand or accept these risks, do
        not create an account or deposit funds.
      </p>
    </LegalLayout>
  );
}
