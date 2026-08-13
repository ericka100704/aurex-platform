import LegalLayout from "@/components/legal/LegalLayout";

export const metadata = {
  title: "Privacy Policy · AUREX",
  description: "How AUREX collects, uses, and stores personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="14 August 2026">
      <p>
        This policy explains how AUREX collects and uses personal data when you
        use our website and dashboard. We process data to operate the Platform,
        process payments, prevent fraud, and comply with law.
      </p>
      <h2 className="font-display text-xl text-white">1. Data we collect</h2>
      <p>
        Account data: name, email, phone, password hash, referral codes, and
        account status. Transaction data: deposit amounts, payment method,
        receipts or checkout references, investments, withdrawals, and wallet
        ledger entries. Technical data: session cookies, IP address used for
        login rate limiting, and device/browser information.
      </p>
      <h2 className="font-display text-xl text-white">2. How we use data</h2>
      <p>
        We use data to create and secure your account, credit deposits, run
        plans and referrals, review withdrawals, send verification or password
        reset emails, notify you of account events, and improve security.
      </p>
      <h2 className="font-display text-xl text-white">3. Payment partners</h2>
      <p>
        If you pay through a checkout provider (for example PayMongo) or
        e-wallets such as GCash, Maya, or GoTyme, those providers process
        payment data under their own policies. We receive payment status and
        references needed to credit your wallet. Receipt images you upload are
        stored so administrators can verify the transfer.
      </p>
      <h2 className="font-display text-xl text-white">4. Storage</h2>
      <p>
        Account and transaction records are stored in our database (hosted with
        our cloud provider). Deposit receipt files may be stored in private
        object storage and accessed by administrators via time-limited links.
        We retain data while your account is active and as needed for dispute
        handling, security, and legal obligations.
      </p>
      <h2 className="font-display text-xl text-white">5. Cookies and sessions</h2>
      <p>
        We use an HTTP-only session cookie to keep you signed in. We do not
        sell personal data. We do not use the session cookie as a third-party
        advertising tracker.
      </p>
      <h2 className="font-display text-xl text-white">6. Sharing</h2>
      <p>
        We share data with infrastructure and payment vendors who process it
        for us, and if required by law, regulators, or to prevent fraud. We do
        not sell your personal information.
      </p>
      <h2 className="font-display text-xl text-white">7. Your choices</h2>
      <p>
        You may update your name and phone in Profile, change your password,
        and request account-related emails. To correct or delete data, contact
        support through the Platform. Some records must be kept for audit or
        legal reasons.
      </p>
      <h2 className="font-display text-xl text-white">8. Contact</h2>
      <p>
        Privacy questions can be sent to the support channel published on
        AUREX. This policy is a Platform template and should be reviewed by
        counsel for your entity before relying on it for regulatory filings.
      </p>
    </LegalLayout>
  );
}
