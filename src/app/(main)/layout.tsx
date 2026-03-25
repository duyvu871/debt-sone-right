import { AppDock } from "@/shared/components/AppDock";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 pb-21 md:pb-28">
        {children}
      </div>
      <AppDock />
    </div>
  );
}
