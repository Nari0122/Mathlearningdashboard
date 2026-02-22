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
  ClipboardList,
  BarChart3,
  BookMarked,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getSystemSettings } from "@/actions/system-actions";
import { deactivateStudentAccount, withdrawStudentAccount } from "@/actions/account-actions";
import { Checkbox } from "@/components/ui/checkbox";

interface StudentSidebarProps {
  userName?: string;
  className?: string;
}

export function StudentSidebar({ userName, className }: StudentSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const studentId = params?.id as string;
  const docId = (session?.user as { sub?: string })?.sub ?? (session?.user as { id?: string })?.id ?? studentId;
  const [fallbackName, setFallbackName] = useState<string | null>(null);
  const [settings, setSettings] = useState({ supportEmail: 'support@mathclinic.com', supportPhone: '02-1234-5678' });
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportLoading, setSupportLoading] = useState(false);
  const displayName = userName?.trim() || fallbackName || "학생";

  useEffect(() => {
    getSystemSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!studentId || userName) return;
    fetch(`/api/students/${studentId}`)
      .then((res) => {
        if (!res.ok) return res.json().then((body) => Promise.reject(new Error(body?.error || "Fetch failed")));
        return res.json();
      })
      .then((data) => {
        setFallbackName(data?.name ? String(data.name) : "학생");
      })
      .catch(() => {
        setFallbackName("학생");
      });
  }, [studentId, userName]);

  if (!studentId) return null;

  const sidebarItems = [
    { icon: LayoutDashboard, label: "대시보드", href: `/student/${studentId}` },
    { icon: BookOpen, label: "나의 학습", href: `/student/${studentId}/learning` },
    { icon: BookMarked, label: "오답 노트", href: `/student/${studentId}/incorrect-notes` },
    { icon: BarChart3, label: "시험 성적", href: `/student/${studentId}/exams` },
    { icon: ClipboardList, label: "학습 기록", href: `/student/${studentId}/history` },
    { icon: Calendar, label: "수업 일정", href: `/student/${studentId}/schedule` },
    { icon: PenTool, label: "숙제 관리", href: `/student/${studentId}/homework` },
    { icon: Link2, label: "연동 관리", href: `/student/${studentId}/links` },
  ];

  return (
    <div className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-full min-h-0", className)}>
      <div className="p-4 md:p-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-lg md:text-xl font-bold text-white">M</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold text-gray-900 tracking-tight leading-tight">강나리 MATH LAB</h1>
            <p className="text-xs text-gray-500 mt-0.5 font-normal">student</p>
          </div>
        </div>
      </div>
      <div className="p-3 md:p-4 border-b border-gray-200 shrink-0">
        <div className="bg-gray-50 rounded-lg p-2 md:p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-0.5 md:mb-1">Student</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 md:p-4">
        <div className="space-y-0.5 md:space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 md:gap-3 h-10 md:h-12 text-sm md:text-base font-medium",
                    isActive
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 p-3 md:p-4 border-t border-gray-200 space-y-1 md:space-y-2 bg-white">
        <Link href="/login" className="block">
          <Button variant="ghost" className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 text-sm md:text-base text-red-500 hover:bg-red-50 hover:text-red-600 min-h-[44px]">
            <LogOut className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            로그아웃
          </Button>
        </Link>
        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              setConfirmDeactivate(false);
              setConfirmWithdraw(false);
              setSupportError(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 md:gap-3 h-10 md:h-12 text-sm md:text-base text-gray-500 hover:text-gray-900 min-h-[44px]">
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              Support
            </Button>
          </DialogTrigger>
          <DialogContent className="pb-[max(1rem,env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>학생 지원 및 계정 정보</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4 pr-2">
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-sm mb-2 text-blue-900">내 정보</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>이름: {displayName}</p>
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

              <div className="border-t border-gray-200 pt-4 space-y-4">
                <h3 className="font-bold text-sm text-gray-900">계정 관리</h3>
                {supportError && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{supportError}</p>
                )}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-amber-900">계정 비활성화 시 로그인이 차단되며, 오답 노트·숙제 등 데이터는 보존됩니다. 재활성화는 선생님에게 요청하세요.</p>
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <Checkbox checked={confirmDeactivate} onCheckedChange={(v) => setConfirmDeactivate(!!v)} />
                    <span className="text-sm">비활성화를 원한다는 것을 확인했습니다.</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full min-h-[44px] text-amber-800 border-amber-300 hover:bg-amber-100"
                    disabled={!confirmDeactivate || supportLoading || !docId}
                    onClick={async () => {
                      if (!docId) return;
                      setSupportLoading(true);
                      setSupportError(null);
                      const res = await deactivateStudentAccount(docId);
                      setSupportLoading(false);
                      if (res.success) {
                        await signOut({ callbackUrl: "/login?error=account_inactive" });
                        router.push("/login?error=account_inactive");
                        return;
                      }
                      setSupportError(res.message ?? "처리 실패");
                    }}
                  >
                    계정 비활성화
                  </Button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-red-900">회원 탈퇴 시 계정과 연결된 데이터가 삭제되며 복구할 수 없습니다.</p>
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <Checkbox checked={confirmWithdraw} onCheckedChange={(v) => setConfirmWithdraw(!!v)} />
                    <span className="text-sm">탈퇴를 원한다는 것을 확인했습니다.</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full min-h-[44px] text-red-700 border-red-300 hover:bg-red-100"
                    disabled={!confirmWithdraw || supportLoading || !docId}
                    onClick={async () => {
                      if (!docId) return;
                      setSupportLoading(true);
                      setSupportError(null);
                      const res = await withdrawStudentAccount(docId);
                      setSupportLoading(false);
                      if (res.success) {
                        await signOut({ callbackUrl: "/login" });
                        router.push("/login");
                        return;
                      }
                      setSupportError(res.message ?? "처리 실패");
                    }}
                  >
                    회원 탈퇴
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500 pb-[env(safe-area-inset-bottom)]">
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
