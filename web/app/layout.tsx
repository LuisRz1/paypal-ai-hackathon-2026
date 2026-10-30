import "./globals.css";

export const metadata = {
  title: "Recover",
  description: "AI-compiled, human-approved PayPal recovery with verifiable evidence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
