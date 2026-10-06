import { Manrope } from "next/font/google";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "SOLANA",
  description: "SOLANA — trade, grow, succeed. Online investment platform.",
  icons: {
    icon: [{ url: "/solana-logo.png", type: "image/png" }],
    apple: [{ url: "/solana-logo.png", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
