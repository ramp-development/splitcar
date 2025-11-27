import { AppNavbar } from "@/components/app/app-navbar";
import { AppBreadcrumb } from "@/components/app/app-breadcrumb";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      <AppBreadcrumb />
      <main className="p-4 md:p-6 mx-auto max-w-6xl">{children}</main>
    </div>
  );
}
