import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("parent_session");

  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}
