import { X } from 'lucide-react';
import { useState } from 'react';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (unitName: string) => void;
}

export function AddUnitModal({ isOpen, onClose, onAdd }: AddUnitModalProps) {
  const [unitName, setUnitName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unitName.trim()) {
      onAdd(unitName.trim());
      setUnitName('');
      onClose();
    }
  };

  const handleClose = () => {
    setUnitName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">새 단원 추가</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="unitName" className="block text-sm font-medium text-gray-700 mb-2">
              단원명
            </label>
            <input
              type="text"
              id="unitName"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="예: 집합과 명제"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!unitName.trim()}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
