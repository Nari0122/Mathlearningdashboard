"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Calendar,
  PenTool,
  LogOut,
  HelpCircle,
  User,
  ClipboardList,
  BarChart3,
  BookMarked
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useParams, usePathname } from "next/navigation";

export function StudentSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const studentId = params?.id;

  if (!studentId) return null;

  const sidebarItems = [
    { icon: LayoutDashboard, label: "대시보드", href: `/student/${studentId}` },
    { icon: BookOpen, label: "나의 학습", href: `/student/${studentId}/learning` },
    { icon: BookMarked, label: "오답 노트", href: `/student/${studentId}/incorrect-notes` },
    { icon: BarChart3, label: "시험 성적", href: `/student/${studentId}/exams` },
    { icon: ClipboardList, label: "학습 기록", href: `/student/${studentId}/history` },
    { icon: Calendar, label: "수업 일정", href: `/student/${studentId}/schedule` },
    { icon: PenTool, label: "숙제 관리", href: `/student/${studentId}/homework` },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold text-gray-900">MATHCLINIC</span>
        </div>

        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-base font-medium",
                    isActive
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-200 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-500 hover:text-gray-900">
          <HelpCircle className="w-5 h-5" />
          Support
        </Button>
        <Link href="/login" className="block">
          <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="w-5 h-5" />
            로그아웃
          </Button>
        </Link>
      </div>
    </div>
  );
}
