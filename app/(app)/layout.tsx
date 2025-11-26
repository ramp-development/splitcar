import { AppNavbar } from "@/components/app/app-navbar";
import { AppBreadcrumb } from "@/components/app/app-breadcrumb";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      <AppBreadcrumb />
      <main>{children}</main>
    </div>
  );
}
