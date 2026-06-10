import "~/styles/globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "装机舱 CN | 3D 主机组装配置器",
  description: "面向中国国内 DIY 玩家和装机店的 3D 主机配置、兼容性和价格估算工具。",
};

export const viewport: Viewport = {
  themeColor: "#111417",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
