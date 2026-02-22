"use client";

import { AlertCircle, TrendingDown, BookOpen, Calculator, FileText, Lightbulb } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Unit } from "@/types";

interface AdminErrorAnalysisClientProps {
  units: Unit[];
}

export default function AdminErrorAnalysisClient({ units }: AdminErrorAnalysisClientProps) {
  const totalErrors = units.reduce(
    (acc, unit) => ({
      C: acc.C + (unit.errors?.C ?? 0),
      M: acc.M + (unit.errors?.M ?? 0),
      R: acc.R + (unit.errors?.R ?? 0),
      S: acc.S + (unit.errors?.S ?? 0),
    }),
    { C: 0, M: 0, R: 0, S: 0 }
  );

  const barData = [
    { name: "개념(C)", value: totalErrors.C, fill: "#3b82f6" },
    { name: "계산(M)", value: totalErrors.M, fill: "#ef4444" },
    { name: "독해(R)", value: totalErrors.R, fill: "#f97316" },
    { name: "전략(S)", value: totalErrors.S, fill: "#8b5cf6" },
  ];

  const pieData = barData.filter((d) => d.value > 0);
  const COLORS = ["#3b82f6", "#ef4444", "#f97316", "#8b5cf6"];

  const unitErrorData = units.map((unit) => ({
    name: unit.name,
    C: unit.errors?.C ?? 0,
    M: unit.errors?.M ?? 0,
    R: unit.errors?.R ?? 0,
    S: unit.errors?.S ?? 0,
  }));

  const errorTypes = [
    { type: "C", name: "개념", icon: BookOpen, color: "bg-blue-500", count: totalErrors.C },
    { type: "M", name: "계산", icon: Calculator, color: "bg-red-500", count: totalErrors.M },
    { type: "R", name: "독해", icon: FileText, color: "bg-orange-500", count: totalErrors.R },
    { type: "S", name: "전략", icon: Lightbulb, color: "bg-purple-500", count: totalErrors.S },
  ];

  const totalErrorCount = totalErrors.C + totalErrors.M + totalErrors.R + totalErrors.S;
  const hasData = totalErrorCount > 0;

  return (
    <div className="max-w-[1440px] mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle size={32} className="text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">오답 분석</h1>
        </div>
        <p className="text-gray-600">오답 유형별 상세 분석 및 통계를 확인할 수 있습니다.</p>
      </div>

      {!hasData && (
        <div className="bg-white rounded-2xl shadow-sm p-12">
          <div className="text-center">
            <TrendingDown size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">오답 데이터가 없습니다</h3>
            <p className="text-gray-500">단원 관리에서 오답을 입력하면 분석 결과가 표시됩니다.</p>
          </div>
        </div>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-4 gap-6 mb-8">
            {errorTypes.map((error) => {
              const Icon = error.icon;
              const percentage =
                totalErrorCount > 0 ? ((error.count / totalErrorCount) * 100).toFixed(1) : "0";
              return (
                <div key={error.type} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`${error.color} w-12 h-12 rounded-xl flex items-center justify-center`}
                    >
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{error.name} 오류</p>
                      <p className="text-2xl font-bold text-gray-900">{error.count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`${error.color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">오류 유형 분포</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[barData.findIndex((d) => d.name === entry.name)]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  데이터 없음
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">오류 유형별 빈도</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {unitErrorData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">단원별 오류 분석</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={unitErrorData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="C" name="개념" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="M" name="계산" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="R" name="독해" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="S" name="전략" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
