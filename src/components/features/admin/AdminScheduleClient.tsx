"use client";

import { useState, useTransition } from "react";
import { Plus, Trash, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSchedule, deleteSchedule } from "@/actions/admin-actions";
import { useRouter } from "next/navigation";

interface AdminScheduleClientProps {
    schedules: any[];
    studentId: number;
}

const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

export default function AdminScheduleClient({ schedules, studentId }: AdminScheduleClientProps) {
    const router = useRouter();
    const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
    const [isRegularOpen, setIsRegularOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Session State
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [sessionNumber, setSessionNumber] = useState("");

    // Regular Schedule State
    const [regularDay, setRegularDay] = useState("월요일");
    const [regularStart, setRegularStart] = useState("");
    const [regularEnd, setRegularEnd] = useState("");

    const handleAddSession = async () => {
        if (!date || !startTime || !endTime) return;

        startTransition(async () => {
            const result = await createSchedule(studentId, {
                date,
                startTime,
                endTime,
                status: "scheduled",
                isRegular: false,
                sessionNumber: sessionNumber ? parseInt(sessionNumber) : undefined
            });

            if (result.success) {
                setIsAddSessionOpen(false);
                setDate("");
                setStartTime("");
                setEndTime("");
                setSessionNumber("");
                router.refresh();
            } else {
                alert("수업 추가 실패");
            }
        });
    };

    const handleAddRegular = async () => {
        if (!regularDay || !regularStart || !regularEnd) return;

        startTransition(async () => {
            const result = await createSchedule(studentId, {
                date: "", // Not used for regular
                startTime: regularStart,
                endTime: regularEnd,
                status: "active",
                isRegular: true,
                dayOfWeek: regularDay
            });

            if (result.success) {
                // Don't close dialog immediately to allow adding multiple? 
                // User said "2개 이상 여러개 할 수 있도록".
                // I'll keep dialog open or clear fields? 
                // Usually "Add" closes. Re-opening is fine. Or "Add & Continue".
                // I'll just close for simplicity, but user can open again. Or just clear fields.
                // Text: "2개 이상 여러개 할 수 있도록 해줘" likely means the *capability* to have multiple records, which DB supports.
                // Not necessarily "Batch Add".
                setIsRegularOpen(false);
                setRegularStart("");
                setRegularEnd("");
                router.refresh();
            } else {
                alert("정규 수업 추가 실패");
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        startTransition(async () => {
            await deleteSchedule(id, studentId);
            router.refresh();
        });
    }

    const regularSchedules = schedules.filter((s: any) => s.isRegular);
    const sessions = schedules.filter((s: any) => !s.isRegular);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">수업 일정 관리</h2>
                <div className="space-x-2">
                    <Dialog open={isRegularOpen} onOpenChange={setIsRegularOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Clock className="mr-2 h-4 w-4" />정규 일정 설정</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>정규 수업 일정 추가</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="day" className="text-right">요일</Label>
                                    <Select value={regularDay} onValueChange={setRegularDay}>
                                        <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="r-start" className="text-right">시작 시간</Label>
                                    <Input id="r-start" type="time" value={regularStart} onChange={(e) => setRegularStart(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="r-end" className="text-right">종료 시간</Label>
                                    <Input id="r-end" type="time" value={regularEnd} onChange={(e) => setRegularEnd(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddRegular} disabled={isPending}>
                                    {isPending ? "추가 중..." : "추가하기"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> 수업 추가</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>새 수업 추가 (단건)</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="date" className="text-right">날짜</Label>
                                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="sessionNumber" className="text-right">회차</Label>
                                    <Input
                                        id="sessionNumber"
                                        type="number"
                                        placeholder="예: 1"
                                        value={sessionNumber}
                                        onChange={(e) => setSessionNumber(e.target.value)}
                                        className="col-span-3"
                                        min="1"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="start" className="text-right">시작 시간</Label>
                                    <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="end" className="text-right">종료 시간</Label>
                                    <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddSession} disabled={isPending}>
                                    {isPending ? "추가 중..." : "추가하기"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle className="text-sm text-gray-500">정규 수업 ({regularSchedules.length})</CardTitle></CardHeader>
                    <CardContent>
                        {regularSchedules.length === 0 ? (
                            <p className="text-sm text-gray-400">설정된 정규 일정이 없습니다.</p>
                        ) : (
                            regularSchedules.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                                    <span className="font-bold text-gray-700">{s.dayOfWeek}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{s.startTime} - {s.endTime}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="text-sm text-gray-500">최근 수업 내역</CardTitle></CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <p className="text-sm text-gray-400">수업 내역이 없습니다.</p>
                        ) : (
                            sessions.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center p-3 border-b last:border-0">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold">{s.date}</div>
                                            {s.sessionNumber && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                    {s.sessionNumber}회차
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400">{s.status}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{s.startTime} - {s.endTime}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
