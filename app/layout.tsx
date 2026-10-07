import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Joesblendz — A fresh cut. On your time.", description: "Choose your cut, find a time, and book your next appointment with Joesblendz.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}<p className="site-credit"><small>Designed &amp; developed by Adam Kozman</small></p></body></html>; }

