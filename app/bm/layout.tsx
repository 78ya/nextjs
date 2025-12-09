import { ReactNode } from "react";
import { NotificationProvider } from "./components/NotificationProvider";
import AdminLayout from "./components/AdminLayout";

export default function BMLayout({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      <AdminLayout>{children}</AdminLayout>
    </NotificationProvider>
  );
}
