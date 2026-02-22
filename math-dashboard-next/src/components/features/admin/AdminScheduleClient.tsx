"use client";

import { useState, useTransition } from "react";
import { Plus, Trash, Clock, Pencil, AlertCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSchedule, deleteSchedule, updateSchedule, postponeOrChangeSchedule, type ScheduleChangeType } from "@/actions/admin-actions";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const CHANGE_TYPES: { value: ScheduleChangeType; label: string }[] = [
    { value: "보강", label: "보강" },
    { value: "연기", label: "연기" },
    { value: "취소", label: "취소" },
    { value: "일정변경", label: "일정변경" },
];

interface AdminScheduleClientProps {
    schedules: any[];
    studentDocId: string;
}

const DAYS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

export default function AdminScheduleClient({ schedules, studentDocId }: AdminScheduleClientProps) {
    const router = useRouter();
    const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
    const [isRegularOpen, setIsRegularOpen] = useState(false);
    const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
    const [isEditRegularOpen, setIsEditRegularOpen] = useState(false);
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

    // Conflict Data State
    const [conflictData, setConflictData] = useState<any>(null);
    const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
    const [pendingOriginalSnapshot, setPendingOriginalSnapshot] = useState<any>(null);
    const [pendingUpdateType, setPendingUpdateType] = useState<"session" | "regular" | null>(null);

    const [isPending, startTransition] = useTransition();

    // Session State (Add/Edit)
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);
    const [originalData, setOriginalData] = useState<any>(null); // Snapshot when edit started

    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [sessionNumber, setSessionNumber] = useState("");

    // Regular Schedule State (Add/Edit)
    const [regularDay, setRegularDay] = useState("월요일");
    const [regularStart, setRegularStart] = useState("");
    const [regularEnd, setRegularEnd] = useState("");

    // 연기/변경 팝업 (연기하기)
    const [isPostponeOpen, setIsPostponeOpen] = useState(false);
    const [postponeTarget, setPostponeTarget] = useState<any>(null);
    const [changeType, setChangeType] = useState<ScheduleChangeType>("연기");
    const [changeReason, setChangeReason] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newStartTime, setNewStartTime] = useState("");
    const [newEndTime, setNewEndTime] = useState("");

    const handleAddSession = async () => {
        if (!date || !startTime || !endTime) return;

        startTransition(async () => {
            const result = await createSchedule(studentDocId, {
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
            const result = await createSchedule(studentDocId, {
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

    // --- Handlers for Editing ---

    const handleEditSession = (s: any) => {
        setCurrentEditId(s.id);
        setDate(s.date);
        setStartTime(s.startTime);
        setEndTime(s.endTime);
        setSessionNumber(s.sessionNumber ? String(s.sessionNumber) : "");
        setOriginalData(s); // Save snapshot
        setIsEditSessionOpen(true);
    };

    const handleEditRegular = (s: any) => {
        setCurrentEditId(s.id);
        setRegularDay(s.dayOfWeek);
        setRegularStart(s.startTime);
        setRegularEnd(s.endTime);
        setOriginalData(s); // Save snapshot
        setIsEditRegularOpen(true);
    };

    // --- Update Logic ---

    const handleUpdateSession = async (force: boolean = false) => {
        if (!currentEditId || !date || !startTime || !endTime) return;

        const dataToUpdate = {
            date,
            startTime,
            endTime,
            status: "scheduled", // Maintain status or update? Usually status isn't edited here, just time. 
            // Actually, if date changes, status might stay same.
            // For now, let's keep other fields same.
            isRegular: false,
            sessionNumber: sessionNumber ? parseInt(sessionNumber) : undefined
        };

        const snapshot = force ? null : originalData;

        startTransition(async () => {
            const result = await updateSchedule(studentDocId, currentEditId, dataToUpdate, snapshot, force) as any;

            if (result.success) {
                setIsEditSessionOpen(false);
                setIsConflictModalOpen(false);
                router.refresh();
            } else if (result.conflict) {
                // Conflict detected!
                setConflictData(result.latestData);
                setPendingUpdateData(dataToUpdate);
                setPendingOriginalSnapshot(snapshot);
                setPendingUpdateType("session");
                setIsConflictModalOpen(true);
            } else {
                alert("수정 실패: " + result.message);
            }
        });
    };

    const handleUpdateRegular = async (force: boolean = false) => {
        if (!currentEditId || !regularDay || !regularStart || !regularEnd) return;

        const dataToUpdate = {
            startTime: regularStart,
            endTime: regularEnd,
            isRegular: true,
            dayOfWeek: regularDay
            // Regular schedules don't use date/status usually the same way
        };

        const snapshot = force ? null : originalData;

        startTransition(async () => {
            const result = await updateSchedule(studentDocId, currentEditId, dataToUpdate, snapshot, force) as any;

            if (result.success) {
                setIsEditRegularOpen(false);
                setIsConflictModalOpen(false);
                router.refresh();
            } else if (result.conflict) {
                setConflictData(result.latestData);
                setPendingUpdateData(dataToUpdate);
                setPendingOriginalSnapshot(snapshot);
                setPendingUpdateType("regular");
                setIsConflictModalOpen(true);
            } else {
                alert("수정 실패: " + result.message);
            }
        });
    };

    // --- Conflict Resolution Handlers ---

    const handleConflictReload = () => {
        // Discard user changes, load latest data
        if (!conflictData) return;

        if (pendingUpdateType === "session") {
            setDate(conflictData.date);
            setStartTime(conflictData.startTime);
            setEndTime(conflictData.endTime);
            setSessionNumber(conflictData.sessionNumber ? String(conflictData.sessionNumber) : "");
            setOriginalData(conflictData); // Update snapshot to latest
        } else {
            setRegularDay(conflictData.dayOfWeek);
            setRegularStart(conflictData.startTime);
            setRegularEnd(conflictData.endTime);
            setOriginalData(conflictData); // Update snapshot
        }
        setIsConflictModalOpen(false);
    };

    const handleConflictForceSave = () => {
        // Force save with user's current input
        if (pendingUpdateType === "session") {
            handleUpdateSession(true);
        } else {
            handleUpdateRegular(true);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        startTransition(async () => {
            await deleteSchedule(id, studentDocId);
            router.refresh();
        });
    };

    const handleOpenPostpone = (s: any) => {
        setPostponeTarget(s);
        setChangeType("연기");
        setChangeReason("");
        setNewDate(s.date || "");
        setNewStartTime(s.startTime || "");
        setNewEndTime(s.endTime || "");
        setIsPostponeOpen(true);
    };

    const handlePostponeSubmit = async () => {
        if (!postponeTarget?.id) return;
        if (!changeReason.trim()) {
            alert("변경 사유를 입력해주세요.");
            return;
        }
        if (changeType !== "취소" && (!newDate || !newStartTime || !newEndTime)) {
            alert("새 날짜와 시간을 입력해주세요.");
            return;
        }
        startTransition(async () => {
            const result = await postponeOrChangeSchedule(studentDocId, postponeTarget.id, {
                changeType,
                reason: changeReason.trim(),
                newDate: changeType === "취소" ? undefined : newDate,
                newStartTime: changeType === "취소" ? undefined : newStartTime,
                newEndTime: changeType === "취소" ? undefined : newEndTime,
            });
            if (result.success) {
                setIsPostponeOpen(false);
                setPostponeTarget(null);
                router.refresh();
            } else {
                alert(result.message || "처리 실패");
            }
        });
    };

    const regularSchedules = schedules
        .filter((s: any) => s.isRegular)
        .sort((a: any, b: any) => DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek));
    const sessions = schedules
        .filter((s: any) => !s.isRegular)
        .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || "") || (b.startTime || "").localeCompare(a.startTime || ""));

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader><CardTitle className="text-sm text-gray-500">정규 수업 · 주 {regularSchedules.length}회</CardTitle></CardHeader>
                    <CardContent>
                        {regularSchedules.length === 0 ? (
                            <p className="text-sm text-gray-400">설정된 정규 일정이 없습니다.</p>
                        ) : (
                            regularSchedules.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded mb-2">
                                    <span className="font-bold text-gray-700 text-sm">{s.dayOfWeek}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-900 mr-2 shrink-0">{s.startTime} - {s.endTime}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => handleEditRegular(s)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle className="text-sm text-gray-500">최근 수업 내역</CardTitle></CardHeader>
                    <CardContent>
                        {sessions.length === 0 ? (
                            <p className="text-sm text-gray-400">수업 내역이 없습니다.</p>
                        ) : (
                            sessions.map((s: any) => {
                                const isModified = s.isModified || s.status === "POSTPONED" || s.status === "CHANGED" || s.status === "CANCELLED";
                                const hasChangeBadge = s.scheduleChangeType;
                                return (
                                    <div
                                        key={s.id}
                                        className={`flex justify-between items-center p-3 border-b last:border-0 ${isModified ? "opacity-70" : ""}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {hasChangeBadge && (
                                                    <Badge className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-full">
                                                        {s.scheduleChangeType}
                                                    </Badge>
                                                )}
                                                <div className={isModified ? "line-through text-gray-500" : "font-bold"}>{s.date}</div>
                                                {s.sessionNumber && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                        {s.sessionNumber}회차
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {(() => {
                                                    if (s.status === "CANCELLED") return "취소됨";
                                                    if (s.status === "POSTPONED") return "연기됨";
                                                    if (s.status === "CHANGED") return "일정 변경됨";
                                                    const scheduleEnd = new Date(`${s.date}T${s.endTime}`);
                                                    const now = new Date();
                                                    const isPassed = now > scheduleEnd;
                                                    if (s.status === "cancelled") return "취소됨";
                                                    if (s.status === "completed" || isPassed) return "수업 완료";
                                                    if (s.status === "scheduled") return "예정됨";
                                                    return s.status;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm mr-2 ${isModified ? "line-through text-gray-500" : ""}`}>{s.startTime} - {s.endTime}</span>
                                            {!isModified && (
                                                <Button variant="ghost" size="sm" className="h-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50" onClick={() => handleOpenPostpone(s)} title="연기/보강/취소/일정변경">
                                                    <CalendarClock className="h-4 w-4 mr-1" /> 연기
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={() => handleEditSession(s)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isEditRegularOpen} onOpenChange={setIsEditRegularOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>정규 수업 일정 수정</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-r-day" className="text-right">요일</Label>
                                <Select value={regularDay} onValueChange={setRegularDay}>
                                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-r-start" className="text-right">시작 시간</Label>
                                <Input id="edit-r-start" type="time" value={regularStart} onChange={(e) => setRegularStart(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-r-end" className="text-right">종료 시간</Label>
                                <Input id="edit-r-end" type="time" value={regularEnd} onChange={(e) => setRegularEnd(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => handleUpdateRegular(false)} disabled={isPending}>
                                {isPending ? "수정 중..." : "수정하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditSessionOpen} onOpenChange={setIsEditSessionOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>수업 일정 수정</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-date" className="text-right">날짜</Label>
                                <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-sessionNumber" className="text-right">회차</Label>
                                <Input
                                    id="edit-sessionNumber"
                                    type="number"
                                    placeholder="예: 1"
                                    value={sessionNumber}
                                    onChange={(e) => setSessionNumber(e.target.value)}
                                    className="col-span-3"
                                    min="1"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-start" className="text-right">시작 시간</Label>
                                <Input id="edit-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-end" className="text-right">종료 시간</Label>
                                <Input id="edit-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => handleUpdateSession(false)} disabled={isPending}>
                                {isPending ? "수정 중..." : "수정하기"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Conflict Modal */}
                <Dialog open={isConflictModalOpen} onOpenChange={setIsConflictModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-amber-600">
                                <AlertCircle className="h-5 w-5" />
                                수업 정보가 변경됨
                            </DialogTitle>
                            <DialogDescription>
                                편집하는 동안 다른 사용자에 의해 수업 정보가 변경되었습니다.
                                어떻게 처리하시겠습니까?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-amber-50 p-4 rounded-md text-sm text-amber-800 mb-4">
                            <p className="font-bold mb-2">변경된 최신 정보:</p>
                            {conflictData && (
                                <ul className="list-disc pl-5 space-y-1">
                                    {pendingUpdateType === 'session' ? (
                                        <>
                                            <li>날짜: {conflictData.date}</li>
                                            <li>시간: {conflictData.startTime} - {conflictData.endTime}</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>요일: {conflictData.dayOfWeek}</li>
                                            <li>시간: {conflictData.startTime} - {conflictData.endTime}</li>
                                        </>
                                    )}
                                </ul>
                            )}
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handleConflictReload} className="w-full sm:w-auto">
                                최신 정보로 다시 불러오기
                            </Button>
                            <Button onClick={handleConflictForceSave} className="w-full sm:w-auto">
                                내 입력 유지하고 저장
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 연기/보강/취소/일정변경 팝업 */}
                <Dialog open={isPostponeOpen} onOpenChange={setIsPostponeOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarClock className="h-5 w-5 text-violet-600" />
                                수업 일정 연기 및 변경
                            </DialogTitle>
                            <DialogDescription>
                                {postponeTarget && (
                                    <span className="text-gray-600">
                                        기존 일정: {postponeTarget.date} {postponeTarget.startTime} - {postponeTarget.endTime}
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">변경 유형</Label>
                                <Select value={changeType} onValueChange={(v) => setChangeType(v as ScheduleChangeType)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CHANGE_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="change-reason" className="text-right">변경 사유</Label>
                                <Input
                                    id="change-reason"
                                    value={changeReason}
                                    onChange={(e) => setChangeReason(e.target.value)}
                                    placeholder="사유 입력"
                                    className="col-span-3"
                                />
                            </div>
                            {changeType !== "취소" && (
                                <>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-date" className="text-right">새 날짜</Label>
                                        <Input
                                            id="new-date"
                                            type="date"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-start" className="text-right">시작 시간</Label>
                                        <Input
                                            id="new-start"
                                            type="time"
                                            value={newStartTime}
                                            onChange={(e) => setNewStartTime(e.target.value)}
                                            className="col-span-3"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="new-end" className="text-right">종료 시간</Label>
                                        <Input
                                            id="new-end"
                                            type="time"
                                            value={newEndTime}
                                            onChange={(e) => setNewEndTime(e.target.value)}
                                            className="col-span-3"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPostponeOpen(false)}>취소</Button>
                            <Button onClick={handlePostponeSubmit} disabled={isPending} className="bg-violet-600 hover:bg-violet-700">
                                {isPending ? "저장 중..." : "저장"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
