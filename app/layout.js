import { Inter, Newsreader, Montserrat, Mulish } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

/* Certificate typography.
   Both are self-hosted by next/font (no external CDN link, per TASTE §7.1), so
   they are available offline and are already loaded when html2canvas-pro
   rasterises the certificate — `document.fonts.ready` is awaited before capture.
   Weights match what the reference PDF embeds: Montserrat Regular/SemiBold/Bold
   and Mulish Regular. */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Invensis Learning Portal",
  description: "Invensis Learning Portal",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${montserrat.variable} ${mulish.variable} h-full antialiased`}
    >
      <body className="h-full">{children}</body>
    </html>
  );
}
