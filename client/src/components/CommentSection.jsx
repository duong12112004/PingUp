import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import api from '../api/axios'
import toast from 'react-hot-toast'
import moment from 'moment'
import { X } from 'lucide-react'
import ConfirmModal from './ConfirmModal'


// Một component nhỏ để hiển thị từng bình luận
const CommentItem = ({ comment, currentUserId, onDelete }) => {

    // Kiểm tra xem user hiện tại có phải là chủ của comment không
    const isOwner = comment.user._id === currentUserId;

    return (
        <div className="flex items-start gap-2 py-2 group">
            {/* ... */}
            <img src={comment.user.profile_picture} alt="" className="w-8 h-8 rounded-full" />
            <div className="flex-1 bg-gray-100 rounded-lg p-2">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.user.full_name}</span>
                    <span className="text-xs text-gray-500">{moment(comment.createdAt).fromNow()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
            </div>
            {isOwner && (
                <button 
                    onClick={() => onDelete(comment._id)}
                    className="text-gray-400 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa bình luận"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}


// Component chính
const CommentSection = ({ postId, onCommentPosted, onCommentDeleted }) => {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const [isFetching, setIsFetching] = useState(false)
    
    const { getToken } = useAuth()
    const currentUser = useSelector((state) => state.user.value)

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    // State loading cho nút xóa (trong modal)
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenDeleteModal = (commentId) => {
        setCommentToDelete(commentId); // Lưu ID lại
        setIsModalOpen(true);         // Mở modal
    };

    const onConfirmDelete = async () => {
        if (!commentToDelete) return; // Kiểm tra an toàn

        setIsDeleting(true); // Bật loading
        try {
            const token = await getToken();
            const { data } = await api.delete(`/api/comments/${commentToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                setComments(prev => prev.filter(comment => comment._id !== commentToDelete));
                onCommentDeleted?.(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Lỗi khi xóa: " + error.message);
        } finally {
            setIsDeleting(false);     // Tắt loading
            setIsModalOpen(false);    // Đóng modal
            setCommentToDelete(null); // Reset ID
        }
    }

   

    // 1. Fetch các bình luận đã có khi component được tải
    useEffect(() => {
        const fetchComments = async () => {
            setIsFetching(true)
            try {
                // Bạn cần tạo API route này ở backend
                const { data } = await api.get(`/api/comments/${postId}`)
                if (data.success) {
                    setComments(data.comments)
                }
            } catch (error) {
                console.error("Lỗi khi tải bình luận:", error)
            }finally {
                // --- THÊM DÒNG NÀY ---
                setIsFetching(false) 
                // --- KẾT THÚC THÊM ---
            }
        }
        fetchComments()
    }, [postId])

    // 2. Xử lý khi gửi bình luận mới
    const handleSubmitComment = async (e) => {
        e.preventDefault()
        if (!newComment.trim()) return // Không gửi comment rỗng

        setIsLoading(true)
        try {
            const token = await getToken()
            // Bạn cần tạo API route này ở backend
            const { data } = await api.post('/api/comments', 
                { postId: postId, content: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (data.success) {
                toast.success("Đã đăng bình luận!")
                
                // Thêm bình luận mới vào danh sách (hiển thị ngay lập tức)
                // Giả sử backend trả về 'data.comment' đã populate user
                setComments(prev => [...prev, data.comment])

                setNewComment("") // Xóa nội dung ô nhập
                onCommentPosted() // Gọi callback để cập nhật số lượng ở PostCard
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Không thể đăng bình luận: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="border-t border-gray-200 pt-3 space-y-3">
            {/* Form để đăng bình luận mới */}
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
                <img src={currentUser.profile_picture} alt="" className="w-8 h-8 rounded-full" />
                <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !newComment.trim()}
                    className="bg-indigo-500 text-white rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                    {isLoading ? "Đang..." : "Gửi"}
                </button>
            </form>

            {/* Danh sách các bình luận đã có */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {isFetching ? (
                   <p className="text-sm text-gray-500 text-center py-4">Đang tải bình luận...</p>
                ) : comments.length > 0 ? (
                    comments.map(comment => (
                        <CommentItem 
                            key={comment._id} 
                            comment={comment} 
                            // --- TRUYỀN THÊM PROPS NÀY ---
                            currentUserId={currentUser._id}
                            onDelete={handleOpenDeleteModal}
                        />
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center py-2">Chưa có bình luận nào.</p>
                )}
            </div>
            <ConfirmModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)} // Hàm khi bấm "Hủy"
                onConfirm={onConfirmDelete}           // Hàm khi bấm "Xác nhận"
                title="Xác nhận xóa bình luận?"
                message="Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác."
                isLoading={isDeleting}
            />
        </div>
    )
}

export default CommentSection