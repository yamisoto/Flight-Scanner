import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skyfare NG — Compare Nigerian domestic flights",
  description: "Search and compare prices, times, and airlines across Nigerian domestic routes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
