import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";


// Add Post
export const addPost = async (req, res) => {
    try {
        // support both req.userId (from protect middleware) and req.auth()
        const userId = req.userId || (req.auth ? (await req.auth()).userId : null);
        const { content, post_type } = req.body;
        const images = req.files

        let image_urls = []

        if (images.length) {
            image_urls = await Promise.all(
                images.map(async (image) => {
                    const fileBuffer = fs.readFileSync(image.path)
                    const response = await imagekit.upload({
                        file: fileBuffer,
                        fileName: image.originalname,
                        folder:"posts"
                    })
                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1280' }
                        ]
                    })
                    return url
                })
            )
        }

        await Post.create({
            user: userId,
            content,
            image_urls,
            post_type
        })
        res.json({success:true, message:"Đã đăng bài thành công"});
    } catch (error) {
        console.log(error)
        res.json({success:false,message: error.message});
    }
}

//Get Post
export const getFeedPost = async (req, res) => {
    try {
        const userId = req.userId || (req.auth ? (await req.auth()).userId : null);
        const user = await User.findById(userId)

        // User connection add followings
        const userIds = [userId, ...user.connections, ...user.following]
        const posts = await Post.find({ user: { $in: userIds } }).populate('user').sort({ createdAt: -1 });

        res.json({ success: true, posts })
    } catch (error) {
        console.log(error)
        res.json({success:false,message: error.message});
    }
}

//like Post

export const likePost = async (req, res) => {
    try {
        const userId = req.userId || (req.auth ? (await req.auth()).userId : null);
        const {postId} = req.body;

        const post = await Post.findById(postId)

        if(post.likes_count.includes(userId)){
            post.likes_count=post.likes_count.filter(user=>user !==userId)
            await post.save();
            res.json({success:true,message:'Đã bỏ thích bài đăng'}) 
        }else{
            post.likes_count.push(userId)
            await post.save()
            res.json({success:true,message:'Đã thích bài đăng'}) 
        }
    } catch (error) {
        console.log(error)
        res.json({success:false,message: error.message});
    }
}

// Delete Post
export const deletePost = async (req, res) => {
    try {
        const userId = req.userId || (req.auth ? (await req.auth()).userId : null);
        const {postId} = req.params;
        const post = await Post.findById(postId)

        if(!post){
            return res.status(404).json({success:false,message:"Không tìm thấy bài đăng"});
        }
        // post.user may be string (User._id is string) or ObjectId; compare accordingly
        const ownerId = typeof post.user === 'string' ? post.user : post.user.toString();
        if(ownerId !== userId){
            return res.status(403).json({success:false,message:"Bạn không có quyền thực hiện hành động này"});
        }

        // delete related comments
        await Comment.deleteMany({ post: postId });

        await Post.findByIdAndDelete(postId);
        res.json({success:true,message:"Đã xóa bài đăng thành công"});
    } catch (error) {
        console.log(error)
        res.json({success:false,message: error.message});
    }
}
        