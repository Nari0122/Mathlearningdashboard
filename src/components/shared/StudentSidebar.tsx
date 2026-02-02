"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, BookCheck, FileText, ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSidebarProps {
  studentName?: string;
  className?: string;
}

export function StudentSidebar({ studentName = "학생", className }: StudentSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "대시보드", icon: Home },
    { href: "/schedule", label: "수업일정", icon: Calendar },
    { href: "/homework", label: "숙제", icon: BookCheck },
    { href: "/exams", label: "시험기록", icon: FileText },
    { href: "/study/history", label: "학습기록", icon: ClipboardList },
    { href: "/study/my-learning", label: "나의학습", icon: BookCheck },
  ];

  return (
    <div className={cn("w-64 bg-slate-800 text-white h-screen flex flex-col", className)}>
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold mb-1">MATHCLINIC</h1>
        <p className="text-sm text-gray-400">{studentName} 학생</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Check if pathname starts with the item href (for sub-routes), but exact for dashboard
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <Link
          href="/login"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">로그아웃</span>
        </Link>
      </div>
    </div>
  );
}
