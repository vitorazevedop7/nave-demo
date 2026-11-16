import type { Metadata } from "next";
import { Nunito, Poppins, Comfortaa } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-poppins",
});

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-comfortaa",
});

export const metadata: Metadata = {
  title: "NAVE — Sistema de Gestão",
  description:
    "Núcleo Assistencial Veleiro da Esperança — gestão de triagens, encaminhamentos, agenda, prontuários e doações.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "NAVE — Sistema de Gestão",
    description:
      "Núcleo Assistencial Veleiro da Esperança — gestão de triagens, encaminhamentos, agenda, prontuários e doações.",
    siteName: "NAVE",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${nunito.className} ${poppins.variable} ${comfortaa.variable} antialiased`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
