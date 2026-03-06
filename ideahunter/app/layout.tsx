import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaHunter - AI 비즈니스 아이디어 큐레이터",
  description: "AI가 자동으로 수집·분석한 비즈니스 아이디어를 큐레이션하고, 버튼 한 번으로 Claude Code 프롬프트를 생성합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
