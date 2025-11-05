// src/components/ConfirmModal.js
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    isLoading = false 
}) => {

    // Nếu không 'isOpen', không render gì cả
    if (!isOpen) {
        return null;
    }

    return (
        // Lớp phủ (Overlay)
        <div 
            onClick={onClose} // Đóng modal khi bấm ra ngoài
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
            {/* Hộp Modal */}
            <div 
                onClick={(e) => e.stopPropagation()} // Ngăn click bên trong modal đóng modal
                className="relative w-full max-w-sm p-6 bg-white rounded-lg shadow-xl"
            >
                {/* Nút đóng (X) ở góc */}
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon Cảnh báo */}
                    <div className="flex items-center justify-center w-12 h-12 mb-4 text-red-500 bg-red-100 rounded-full">
                        <AlertTriangle size={28} />
                    </div>

                    {/* Tiêu đề */}
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title || "Bạn chắc chứ?"}
                    </h3>

                    {/* Thông điệp */}
                    <p className="mt-2 text-sm text-gray-600">
                        {message || "Hành động này không thể được hoàn tác."}
                    </p>

                    {/* Các nút bấm */}
                    <div className="flex w-full gap-3 mt-6">
                        {/* Nút Hủy */}
                        <button 
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
                        >
                            Hủy
                        </button>
                        
                        {/* Nút Xác nhận (Xóa) */}
                        <button 
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Đang xử lý..." : "Xác nhận"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;