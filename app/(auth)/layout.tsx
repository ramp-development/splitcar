export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-background to-muted/20 p-4">
      {children}
    </div>
  );
}
