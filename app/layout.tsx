import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { thTH } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          footerAction: "hidden",
          footer: "hidden",
        },
      }}
      localization={{
        ...thTH,
        formButtonPrimary: "เข้าสู่ระบบ",
        formFieldLabel__username: "เบอร์โทรศัพท์",
        socialButtonsBlockButton: "เข้าสู่ระบบด้วย {{provider|titleize}}",
        dividerText: "สำหรับ ผู้ปกครอง",
        signIn: {
          start: {
            title: "ยินดีต้อนรับสู่ KKS Camp",
            subtitle: "ล็อคอินเพื่อเข้าใช้งานระบบ",
          },
        },
        unstable__errors: {
          form_identifier_not_found: "ไม่พบเบอร์โทรศัพท์นี้ในระบบ",
          form_param_format_invalid: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง",
          form_param_nil: "กรุณากรอกข้อมูล",
          form_password_incorrect: "รหัสผ่านไม่ถูกต้อง",
        },
      }}
    >
      <html suppressHydrationWarning lang="en">
        <body
          className={clsx(
            "min-h-screen text-foreground bg-[#fff8f2] font-sans antialiased",
            fontSans.variable,
          )}
        >
          <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
