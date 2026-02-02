import type { Metadata } from "next";
import { AdminSidebar } from "@/components/shared/AdminSidebar";

export const metadata: Metadata = {
    title: "Admin Dashboard | MATHCLINIC",
    description: "Math Learning Management System",
};

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 overflow-y-auto">
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
