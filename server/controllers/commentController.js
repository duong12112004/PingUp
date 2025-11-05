import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

export const getCommentsForPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ post: postId })
            .populate('user', 'full_name profile_picture username') // Chỉ lấy các trường cần thiết
            .sort({ createdAt: 'asc' }); // Sắp xếp từ cũ đến mới

        res.json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createComment = async (req, res) => {
    try {
        const userId = req.userId; // Lấy userId từ middleware
        const { postId, content } = req.body;

        console.log('Tạo bình luận:', { userId, postId, content });

        if (!content) {
            return res.status(400).json({ success: false, message: "Nội dung không được rỗng." });
        }

        let newComment = new Comment({
            post: postId,
            user: userId,
            content: content
        });

        await newComment.save();

        // Cập nhật số lượng comment trong Post (QUAN TRỌNG)
        await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });

        // Populate thông tin user để gửi về cho client
        newComment = await newComment.populate('user', 'full_name profile_picture username');

        res.status(201).json({ success: true, comment: newComment });

    } catch (error) {
        console.error('Lỗi khi tạo bình luận:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { userId } = req.auth(); // Lấy user ID từ middleware
        const { commentId } = req.params; // Lấy comment ID từ URL

        const comment = await Comment.findById(commentId);

        // 1. Kiểm tra xem comment có tồn tại không
        if (!comment) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bình luận." });
        }

        // 2. Kiểm tra quyền (QUAN TRỌNG)
        // Chỉ chủ sở hữu comment mới được xóa
        if (comment.user.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xóa bình luận này." });
        }

        // 3. Tiến hành xóa
        await Comment.findByIdAndDelete(commentId);

        // 4. Cập nhật lại (giảm) số lượng comment trong Post
        await Post.findByIdAndUpdate(comment.post, { $inc: { comments_count: -1 } });

        res.json({ success: true, message: "Đã xóa bình luận." });

    } catch (error) {
        console.log("LỖI KHI XÓA COMMENT:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};