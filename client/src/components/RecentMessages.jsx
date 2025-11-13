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
        const groupedMessages = messagesToProcess.reduce((acc, message) => {
            let otherPartyId = null;

            if (message.from_user_id && message.to_user_id && currentUser) { // Kiểm tra cả 3
                 if (message.from_user_id._id.toString() === currentUser._id) {
                    otherPartyId = message.to_user_id._id.toString();
                 } else {
                    otherPartyId = message.from_user_id._id.toString();
                 }
            }
            
            if (otherPartyId) {
                if (!acc[otherPartyId] || new Date(message.createdAt) > new Date(acc[otherPartyId].createdAt)) {
                    acc[otherPartyId] = message;
                }
            }
            return acc;
        }, {});

        const sortedMessages = Object.values(groupedMessages).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sortedMessages;
    };

    // Chỉ chạy 1 lần khi component tải để lấy tin nhắn ban đầu
    const fetchRecentMessages = useCallback(async () => {
        if (!currentUser) return; // Thêm kiểm tra an toàn
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/recent-messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setMessages(processMessages(data.messages));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [getToken, currentUser]); 

    // useEffect 1: Tải tin nhắn ban đầu
    useEffect(() => {
        if (currentUser) { 
            fetchRecentMessages();
        }
    }, [currentUser, fetchRecentMessages]);


    // useEffect 2: Lắng nghe SSE (REAL-TIME)
    useEffect(() => {
        if (currentUser?._id) {
            const eventSource = new EventSource(import.meta.env.VITE_BASEURL + '/api/message/' + currentUser._id);

            eventSource.onmessage = (event) => {
                const newMessage = JSON.parse(event.data);
                
                // Cập nhật state ngay lập tức
                setMessages(prevMessages => {
                    const updatedList = [newMessage, ...prevMessages];
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
        if (!currentUser || !message.from_user_id || !message.to_user_id) return null; 
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
                                            {message.from_user_id._id === currentUser._id ? "Bạn: " : ""}
                                            {message.text ? message.text.slice(0, 20) + (message.text.length > 20 ? "..." : "") : 'Phương tiện'}
                                        </p>
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