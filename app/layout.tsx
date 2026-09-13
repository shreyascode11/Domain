import type { Metadata } from "next";
import { Cinzel, Barlow, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display: carved-inscription serif for titles and the map.
const display = Cinzel({ variable: "--font-display-face", subsets: ["latin"], weight: ["500", "700", "900"] });
// HUD: condensed, game-menu labels.
const hud = Barlow_Condensed({ variable: "--font-hud-face", subsets: ["latin"], weight: ["500", "600", "700"] });
// Body copy.
const body = Barlow({ variable: "--font-body-face", subsets: ["latin"], weight: ["400", "500", "600"] });
// Code.
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "DOMAIN — the world is the document",
  description:
    "An adventure where the world is a real web page. Learn CSS by rebuilding the ground beneath your feet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${hud.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
