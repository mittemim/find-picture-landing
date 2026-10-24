import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Без происхождения — закрытая галерея",
  description: "Первичное обращение по делу о картине без происхождения. Аккуратный разговор начинается с небольшой детали.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
