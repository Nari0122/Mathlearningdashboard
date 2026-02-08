"use client";

import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <ShieldAlert size={40} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">접근 권한 없음</h1>
          <p className="text-lg text-red-600 font-semibold mb-4">403 Forbidden</p>
          <p className="text-gray-600 mb-8">
            이 페이지에 접근할 수 있는 권한이 없습니다.<br />
            관리자에게 문의하거나 이전 페이지로 돌아가주세요.
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">도움이 필요하신가요?</span><br />
            관리자에게 문의하여 적절한 권한을 요청하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
