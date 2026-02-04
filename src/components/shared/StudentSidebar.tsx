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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState } from "react";

import { getSystemSettings } from "@/actions/system-actions";

export function StudentSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const studentId = params?.id as string;
  const [studentName, setStudentName] = useState<string>("불러오는 중...");
  const [settings, setSettings] = useState({ supportEmail: 'support@mathclinic.com', supportPhone: '02-1234-5678' });

  useEffect(() => {
    getSystemSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (studentId) {
      console.log('Fetching student name for ID:', studentId);
      fetch(`/api/students/${studentId}`)
        .then(res => {
          if (!res.ok) throw new Error('Fetch failed');
          return res.json();
        })
        .then(data => {
          console.log('Fetched student data:', data);
          if (data && data.name) setStudentName(data.name);
        })
        .catch(err => {
          console.error('Error fetching student name:', err);
        });
    }
  }, [studentId]);

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
        <Link href="/login" className="block">
          <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="w-5 h-5" />
            로그아웃
          </Button>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-500 hover:text-gray-900">
              <HelpCircle className="w-5 h-5" />
              Support
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>학생 지원 및 계정 정보</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-sm mb-2 text-blue-900">내 정보</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>이름: {studentName}</p>
                  <p>권한: 학생</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm text-gray-900">문의하기</h3>
                <p className="text-sm text-gray-600">
                  시스템 이용 중 궁금한 점이 있거나 도움이 필요하면 선생님께 직접 문의하거나 아래의 고객센터로 연락해 주세요.
                </p>
                <div className="mt-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">Email:</span> {settings.supportEmail}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <span className="font-semibold">Tel:</span> {settings.supportPhone}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500">
                <p>앱 버전: v2.2.0 (Latest)</p>
                <p className="mt-1">화면이 이상하게 보일 경우 '로그아웃' 후 다시 로그인해 보세요.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
