import "./globals.css";

export const metadata = {
  title: "여름위키",
  description: "나만의 위키",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}