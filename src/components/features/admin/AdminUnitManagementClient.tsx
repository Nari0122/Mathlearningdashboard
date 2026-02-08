"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Search, Plus } from "lucide-react";
import { UnitCard } from "@/components/features/dashboard/UnitCard-v2";
import { AddUnitModal } from "@/components/features/admin/AddUnitModal";
import { Unit } from "@/types";
import {
  addUnit,
  updateUnitDifficulty,
  updateUnitName,
  deleteUnit,
  updateUnitError,
  updateUnitStatus,
  updateCompletionStatus,
} from "@/actions/unit-actions";

interface AdminUnitManagementClientProps {
  initialUnits: Unit[];
  studentId: number | string;
}

export default function AdminUnitManagementClient({
  initialUnits,
  studentId,
}: AdminUnitManagementClientProps) {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setUnits(initialUnits);
  }, [initialUnits]);

  const filteredUnits = units.filter((u) =>
    (u.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDifficultyChange = async (unitId: number, difficulty: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, selectedDifficulty: difficulty } : u))
    );
    await updateUnitDifficulty(unitId, difficulty);
    router.refresh();
  };

  const handleNameChange = async (unitId: number, newName: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, name: newName } : u))
    );
    await updateUnitName(unitId, newName);
    router.refresh();
  };

  const handleDelete = async (unitId: number) => {
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
    await deleteUnit(unitId);
    router.refresh();
  };

  const handleErrorChange = async (
    unitId: number,
    errorType: "C" | "M" | "R" | "S",
    delta: number
  ) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const next = { ...u, errors: { ...u.errors } };
        const key = errorType as keyof typeof next.errors;
        next.errors[key] = Math.max(0, (next.errors[key] ?? 0) + delta);
        return next;
      })
    );
    await updateUnitError(unitId, errorType, delta);
    router.refresh();
  };

  const handleStatusChange = async (unitId: number, status: "HIGH" | "MID" | "LOW") => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, status } : u))
    );
    await updateUnitStatus(unitId, status);
    router.refresh();
  };

  const handleCompletionStatusChange = async (
    unitId: number,
    status: "incomplete" | "in-progress" | "completed"
  ) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, completionStatus: status } : u))
    );
    await updateCompletionStatus(unitId, status);
    router.refresh();
  };

  const handleAddUnit = async (unitName: string) => {
    const res = await addUnit(String(studentId), unitName, "고1");
    if (res.success) {
      setIsAddModalOpen(false);
      router.refresh();
    } else {
      alert(res.error ?? "단원 추가에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FolderTree size={32} className="text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">단원 관리</h1>
        </div>
        <p className="text-gray-600">수학 단원을 추가하고 관리할 수 있습니다.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="단원 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          <span className="font-medium">단원 추가</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {searchQuery ? `검색 결과 (${filteredUnits.length})` : `전체 단원 (${units.length})`}
          </h2>
        </div>

        {filteredUnits.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {filteredUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                onDifficultyChange={handleDifficultyChange}
                onNameChange={handleNameChange}
                onDelete={handleDelete}
                onErrorChange={handleErrorChange}
                showDeleteButton={true}
                onStatusChange={handleStatusChange}
                onCompletionStatusChange={handleCompletionStatusChange}
                isAdmin={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderTree size={48} className="mx-auto text-gray-300 mb-4" />
            {searchQuery ? (
              <>
                <p className="text-gray-500 mb-2">"{searchQuery}"에 대한 검색 결과가 없습니다.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  검색어 초기화
                </button>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700 mb-2">등록된 단원이 없습니다</p>
                <p className="text-sm text-gray-500 mb-4">
                  단원을 추가하여 학습 관리를 시작하세요.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  첫 단원 추가하기
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <AddUnitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUnit}
      />
    </div>
  );
}
