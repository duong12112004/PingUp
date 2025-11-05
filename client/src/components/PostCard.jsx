import React, { useState } from 'react';
import { MoreHorizontal, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import moment from 'moment'; 
import { useAuth } from '@clerk/clerk-react'; 
import api from '../api/axios'; 
import toast from 'react-hot-toast'; 
import CommentSection from './CommentSection'; 


const PostCard = ({ post, onDeletePost }) => {

  const [showMenu, setShowMenu] = useState(false);
  const [likes,setLikes]=useState(post.likes_count);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth(); 

  const isOwner = currentUser?._id === post.user?._id;

  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeletingLocal] = useState(false);

  const postWithHashtags = post.content?.replace(/(#\w+)/g, '<span class="text-blue-500">$1</span>') || '';

  const timeFromNow = moment(post.createdAt).fromNow();

  if (!post || !post.user) {
    return null; 
  }

  
  const handleLike = async () => {
    try {
      const { data } = await api.post(`/api/post/like`, { postId: post._id }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      
      if (data.success) {
        toast.success(data.message);
        setLikes(prev => {
          if (prev.includes(currentUser._id)) {
            return prev.filter(id => id !== currentUser._id);
          } else {
            return [...prev, currentUser._id];
          }
        });
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const isLiked = likes.includes(currentUser?._id);

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/profile/${post.user._id}`;
    const shareText = post.content ? post.content.replace(/\n/g, ' ').slice(0, 200) : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.user.full_name} — PingUp`,
          text: shareText,
          url: postUrl,
        });
        toast.success('Đã chia sẻ');
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(postUrl);
        toast.success('Đã sao chép liên kết bài viết vào clipboard');
      } else {
        const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' ' + postUrl)}`;
        window.open(twitter, '_blank');
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể chia sẻ');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user._id}`}>
            <img
              src={post.user.profile_picture}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          </Link>
          <div>
            <Link to={`/profile/${post.user._id}`} className="font-semibold text-sm hover:underline">
              {post.user.full_name}
            </Link>
            <p className="text-xs text-gray-500">{timeFromNow}</p>
          </div>
        </div>


        {isOwner && (
          <div className="relative">
            <button onClick={() => setShowMenu(prev => !prev)} className="text-gray-500 hover:text-gray-800">
              <MoreHorizontal className="w-5 h-5" />
            </button>

                {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                <ul className="py-1">
                  <li>
                    <button
                      onClick={() => {
                        setShowConfirm(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa bài đăng
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {post.content && (
          <p 
            className="text-sm text-gray-800 mb-4 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: postWithHashtags }}
          />
        )}
      </div>
      
      
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="bg-gray-100 space-y-2">
        {post.image_urls.map((imageUrl, index) => (
          <img
            key={index} 
            src={imageUrl} 
            alt={`Nội dung bài đăng`} 
            className="w-full max-h-[600px] object-cover" 
          />
    ))}
  </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between text-gray-500 mb-2">
          <div className="flex items-center gap-1 text-xs">
            <Heart className="w-4 h-4" />
            <span>{likes.length} lượt thích</span>
          </div>
          <span className="text-xs">{commentCount} bình luận</span>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleLike}  
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors
                        ${isLiked 
                          ? 'text-red-500' 
                          : 'text-gray-600 hover:text-red-500 hover:bg-red-50' 
                        }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            <span className="text-sm font-medium">Thích</span>
          </button>
          
          <button 
            onClick={() => setIsCommentOpen(prev => !prev)} 
            className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-blue-50"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Bình luận</span>
          </button>

          <button onClick={handleShare} className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors p-2 rounded-lg hover:bg-green-50 ml-auto">
            <Send className="w-5 h-5" />
            <span className="text-sm font-medium">Chia sẻ</span>
          </button>
        </div>
          {isCommentOpen && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <CommentSection 
              postId={post._id} 
              onCommentPosted={() => setCommentCount(prev => prev + 1)}
              onCommentDeleted={() => setCommentCount(prev => prev - 1)}
            />
          </div>
        )}

        {/* Confirm modal (delete) */}
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          isLoading={isDeleting}
          title="Xác nhận xóa bài đăng?"
          message="Bạn có chắc chắn muốn xóa bài đăng này? Mọi bình luận liên quan cũng sẽ bị xóa vĩnh viễn."
          onConfirm={async () => {
            setIsDeletingLocal(true);
            try {
              const token = await getToken();
              const { data } = await api.delete(`/api/post/${post._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (data.success) {
                toast.success(data.message);
                setShowConfirm(false);
                onDeletePost?.(post._id);
              } else {
                toast.error(data.message || 'Không thể xóa bài đăng');
              }
            } catch (err) {
              toast.error(err?.response?.data?.message || err.message || 'Lỗi khi xóa bài đăng');
            } finally {
              setIsDeletingLocal(false);
            }
          }}
        />
      </div>
    </div>
  );
};

export default PostCard;