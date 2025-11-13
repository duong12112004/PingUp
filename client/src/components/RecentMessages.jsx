import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useAuth } from '@clerk/clerk-react';
import { useSelector } from 'react-redux'; // <-- 1. Import useSelector
import api from '../api/axios';
import toast from 'react-hot-toast';

const RecentMessages = () => {
    const [messages, setMessages] = useState([]);
    const { getToken } = useAuth();
    // 2. Lấy currentUser (với MongoDB _id) từ Redux
    const currentUser = useSelector((state) => state.user.value);

    // Hàm này (sẽ được tái sử dụng) để nhóm và sắp xếp tin nhắn
    const processMessages = (messagesToProcess) => {
        // --- SỬA LỖI 1: Nhóm bằng ._id ---
        const groupedMessages = messagesToProcess.reduce((acc, message) => {
            // Chúng ta cần ID của người ĐỐI DIỆN (không phải của chính mình)
            // Nếu người gửi là tôi, thì key là người nhận
            // Nếu người gửi là người khác, thì key là người gửi
            let otherPartyId = null;

            // Đảm bảo from_user_id tồn tại (sửa lỗi user bị xóa)
            if (message.from_user_id) {
                 if (message.from_user_id._id.toString() === currentUser._id) {
                    otherPartyId = message.to_user_id._id.toString();
                 } else {
                    otherPartyId = message.from_user_id._id.toString();
                 }
            }
            
            if (otherPartyId) {
                 // Nếu chưa có, hoặc tin nhắn này mới hơn, thì lưu nó
                if (!acc[otherPartyId] || new Date(message.createdAt) > new Date(acc[otherPartyId].createdAt)) {
                    acc[otherPartyId] = message;
                }
            }
            return acc;
        }, {});
        // --- KẾT THÚC SỬA LỖI 1 ---

        // Sắp xếp lại
        const sortedMessages = Object.values(groupedMessages).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sortedMessages;
    };

    // Chỉ chạy 1 lần khi component tải để lấy tin nhắn ban đầu
    const fetchRecentMessages = useCallback(async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/recent-messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                // Lọc bỏ tin nhắn bị lỗi (user đã xóa)
                const validMessages = data.messages.filter(m => m.from_user_id && m.to_user_id);
                setMessages(processMessages(validMessages));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [getToken, currentUser]); // Thêm currentUser vào dependency

    // useEffect 1: Tải tin nhắn ban đầu
    useEffect(() => {
        if (currentUser) { // Chỉ chạy khi có currentUser
            fetchRecentMessages();
        }
        // --- SỬA LỖI 2: Xóa bỏ setInterval ---
    }, [currentUser, fetchRecentMessages]);


    // --- SỬA LỖI 2: Thêm useEffect để lắng nghe SSE (REAL-TIME) ---
    useEffect(() => {
        // Chỉ kết nối SSE khi chúng ta có MongoDB ID (từ Redux)
        if (currentUser?._id) {
            const eventSource = new EventSource(import.meta.env.VITE_BASEURL + '/api/message/' + currentUser._id);

            eventSource.onmessage = (event) => {
                // Khi có tin nhắn mới qua SSE
                const newMessage = JSON.parse(event.data);
                
                // Cập nhật state ngay lập tức
                setMessages(prevMessages => {
                    // Thêm tin nhắn mới vào danh sách cũ
                    const updatedList = [newMessage, ...prevMessages];
                    // Chạy lại logic nhóm và sắp xếp
                    return processMessages(updatedList);
                });
            };

            // Đóng kết nối khi component bị unmount
            return () => {
                eventSource.close();
            };
        }
    }, [currentUser]); // Phụ thuộc vào currentUser


    // Hàm để lấy đúng user (người đối diện) để hiển thị
    const getOtherParty = (message) => {
        if (!currentUser) return message.from_user_id; // An toàn
        if (message.from_user_id._id.toString() === currentUser._id) {
            return message.to_user_id;
        }
        return message.from_user_id;
    }

    return (
        <div className='bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800 '>
            <h3 className='font-semibold text-slate-8 mb-4'>Tin nhắn gần đây</h3>
            <div className='flex flex-col max-h-56 overflow-y-scroll no-scrollbar'>
                {
                    messages.map((message) => {
                        // Lấy thông tin người đối diện (không phải tôi)
                        const otherParty = getOtherParty(message);
                        if (!otherParty) return null; // Bỏ qua nếu user bị lỗi/xóa

                        return (
                            <Link to={`/messages/${otherParty._id}`} key={message._id} className='flex items-start gap-2 py-2 hover:bg-slate-100'>
                                <img src={otherParty.profile_picture} alt="" className='w-8 h-8 rounded-full' />
                                <div className='w-full'>
                                    <div className='flex justify-between '>
                                        <p className='font-medium'>{otherParty.full_name}</p>
                                        <p className='text-[10px] text-slate-400'>{moment(message.createdAt).fromNow()}</p>
                                    </div>
                                    <div className='flex justify-between'>
                                        <p className='text-gray-500'>
                                            {/* Hiển thị "Bạn: " nếu tin nhắn cuối là của tôi */}
                                            {message.from_user_id._id === currentUser._id ? "Bạn: " : ""}
                                            {message.text ? message.text.slice(0, 20) + (message.text.length > 20 ? "..." : "") : 'Phương tiện'}
                                        </p>
                                        {/* Chỉ hiện số 1 nếu tin nhắn là của người khác và chưa xem */}
                                        {message.from_user_id._id !== currentUser._id && !message.seen && (
                                            <p className='bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]'>1</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default RecentMessages;