import { useState } from 'react';
import { MoreHorizontal, Heart, MessageCircle, Send, Trash2, BadgeCheck } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import CommentSection from './CommentSection';

const PostCard = ({ post, onDeletePost }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeletingLocal] = useState(false);

  const currentUser = useSelector((state) => state.user.value);
  const { getToken } = useAuth();
  const navigate = useNavigate(); 

  const isOwner = currentUser?._id === post.user?._id;
  const isLiked = likes.includes(currentUser?._id);

  const postWithHashtags =
    post.content?.replace(/(#\w+)/g, '<span class="text-blue-500">$1</span>') || '';

  if (!post || !post.user) return null;

  const handleLike = async () => {
    try {
      const { data } = await api.post(
        `/api/post/like`,
        { postId: post._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setLikes((prev) =>
          prev.includes(currentUser._id)
            ? prev.filter((id) => id !== currentUser._id)
            : [...prev, currentUser._id]
        );
      } else {
        toast(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/profile/${post.user._id}`;
    const shareText = post.content
      ? post.content.replace(/\n/g, ' ').slice(0, 200)
      : '';
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
        const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText + ' ' + postUrl
        )}`;
        window.open(twitter, '_blank');
      }
    } catch (err) {
      toast.error(err?.message || 'Không thể chia sẻ');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl relative">
      {/* Header: avatar, name, and menu */}
      <div className="flex justify-between items-start">
        <div
          onClick={() => navigate('/profile/' + post.user._id)} 
          className="inline-flex items-center gap-3 cursor-pointer"
        >
          <img
            src={post.user.profile_picture}
            alt=""
            className="w-10 h-10 rounded-full shadow"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-medium">{post.user.full_name}</span>
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-gray-500 text-sm">
              @{post.user.username} ● {moment(post.createdAt).fromNow()}
            </div>
          </div>
        </div>

        
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="text-gray-500 hover:text-gray-800"
            >
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
                      Delete Post
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nội dung bài viết */}
      {post.content && (
        <p
          className="text-gray-800 text-sm whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: postWithHashtags }}
        />
      )}

      {post.image_urls && post.image_urls.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {post.image_urls.map((img, index) => (
            <img
              src={img}
              key={index}
              className={`w-full h-48 object-cover rounded-lg ${
                post.image_urls.length === 1 && 'col-span-2 h-auto'
              }`}
              alt=""
            />
          ))}
        </div>
      )}

      {/* Nút tương tác */}
        <div className="flex items-center gap-4 pt-2 text-gray-600 text-sm  border-t border-gray-300">
          <div
            onClick={handleLike}
            className={`flex items-center gap-1 rounded-lg transition-colors
              ${
                isLiked
                  ? 'text-red-500'
                  : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
              }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
            <span>{likes.length}</span>
          </div>

          <div
            onClick={() => setIsCommentOpen((prev) => !prev)}
            className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount}</span>
          </div>

          <div
            onClick={handleShare}
            className="flex items-center gap-1 text-gray-600 hover:text-green-500 transition-colors rounded-lg hover:bg-green-50 ml-auto"
          >
            <Send className="w-4 h-4" />
          </div>
        </div>

        {isCommentOpen && (
          <div className="pt-4 mt-4 border-t border-gray-100">
            <CommentSection
              postId={post._id}
              onCommentPosted={() => setCommentCount((prev) => prev + 1)}
              onCommentDeleted={() => setCommentCount((prev) => prev - 1)}
            />
          </div>
        )}

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
                headers: { Authorization: `Bearer ${token}` },
              });
              if (data.success) {
                toast.success(data.message);
                setShowConfirm(false);
                onDeletePost?.(post._id);
              } else {
                toast.error(data.message || 'Không thể xóa bài đăng');
              }
            } catch (err) {
              toast.error(
                err?.response?.data?.message ||
                  err.message ||
                  'Lỗi khi xóa bài đăng'
              );
            } finally {
              setIsDeletingLocal(false);
            }
          }}
        />
      
    </div>
  );
};

export default PostCard;
