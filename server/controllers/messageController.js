import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";

// --- SỬA LỖI ĐA KẾT NỐI ---
// connections giờ là một đối tượng, trong đó mỗi userId LÀ MỘT MẢNG (Array)
const connections = {};
// --- KẾT THÚC SỬA LỖI ---

// Controller function for the SSE endpoint
export const sseController = (req, res) => {
    const { userId } = req.params;
    console.log('New client connected : ', userId);

    // set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    //Send an initial event to client
    res.write('log: Connected to SSE stream\n\n');

    // --- SỬA LỖI ĐA KẾT NỐI ---
    // Nếu đây là kết nối đầu tiên của user này, hãy tạo một mảng
    if (!connections[userId]) {
        connections[userId] = [];
    }
    // Thêm kết nối MỚI (res) này vào MẢNG của user
    connections[userId].push(res);
    // --- KẾT THÚC SỬA LỖI ---


    // Gửi "nhịp tim" (heartbeat) 30 giây một lần để giữ kết nối
    const intervalId = setInterval(() => {
        // Chúng ta phải kiểm tra xem kết nối này (res) còn trong mảng không
        if (connections[userId] && connections[userId].includes(res)) {
            res.write(': heartbeat\n\n');
        } else {
            clearInterval(intervalId);
        }
    }, 30000); // 30 giây


    // Handle client disconnection
    req.on('close', () => {
        clearInterval(intervalId); // Dừng heartbeat cho kết nối này
        console.log('Client disconnected: ', userId);
        
        // --- SỬA LỖI ĐA KẾT NỐI ---
        // Xóa kết nối (res) này khỏi mảng của user
        if (connections[userId]) {
            connections[userId] = connections[userId].filter(conn => conn !== res);
            // Nếu user không còn kết nối nào, xóa luôn key userId
            if (connections[userId].length === 0) {
                delete connections[userId];
            }
        }
        // --- KẾT THÚC SỬA LỖI ---
    });
}

// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { to_user_id, text } = req.body;
        const image = req.file;

        let media_url = '';
        let message_type = image ? 'image' : 'text';

        if (message_type === 'image') {
            const fileBuffer = fs.readFileSync(image.path);
            const response = await imagekit.upload({ file: fileBuffer, fileName: image.originalname });
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [ { quality: 'auto' }, { format: 'webp' }, { width: '1280' }]
            });
        }

        const message = await Message.create({
            from_user_id: userId, to_user_id, text, message_type, media_url
        });

        res.json({ success: true, message });

        // Populate tin nhắn (sửa lỗi user đã xóa)
        const messageWithUserData = await Message.findById(message._id).populate('from_user_id');
        if (!messageWithUserData || !messageWithUserData.from_user_id) {
            return; // Nếu người gửi bị xóa, không gửi SSE
        }
        
        const messageData = JSON.stringify(messageWithUserData);

        // --- SỬA LỖI ĐA KẾT NỐI ---
        // Gửi tin nhắn real-time cho TẤT CẢ các kết nối của người nhận
        if (connections[to_user_id] && connections[to_user_id].length > 0) {
            console.log(`Sending message to ${connections[to_user_id].length} connections for user ${to_user_id}`);
            // Lặp qua từng kết nối (res) trong mảng và gửi
            connections[to_user_id].forEach(conn => {
                conn.write(`data: ${messageData}\n\n`);
            });
        }
        // --- KẾT THÚC SỬA LỖI ---

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Get Chat Message
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id } = req.body;
        
        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ]
        }).sort({ createdAt: -1 })
        await Message.updateMany({ from_user_id: to_user_id, to_user_id: userId }, { seen: true })
        res.json({ success: true, messages })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get User Recent Messages
export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        // Lấy Cả tin nhắn gửi và nhận
        const populatedMessages = await Message.find({ 
            $or: [{ from_user_id: userId }, { to_user_id: userId }] 
        })
            .populate('from_user_id to_user_id')
            .sort({ createdAt: -1 });

        // Lọc ra tin nhắn bị lỗi (user đã xóa)
        const validMessages = populatedMessages.filter(
            msg => msg.from_user_id && msg.to_user_id
        );

        res.json({ success: true, messages: validMessages });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}