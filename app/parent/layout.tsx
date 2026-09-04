import { redirect } from "next/navigation";

import { getParentSession } from "@/lib/parent-auth";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getParentSession();

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
