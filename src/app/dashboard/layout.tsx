import { DashboardChrome } from "@/components/dashboard-chrome";
import { requireSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireSession();
  return <DashboardChrome>{children}</DashboardChrome>;
}
