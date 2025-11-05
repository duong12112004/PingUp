import { useEffect, useState, useCallback } from 'react'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'
import { useAuth } from '@clerk/clerk-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Feed = () => {
  const [ feeds,setFeeds ] = useState([]);
  const [ loading,setLoading ] = useState(true);
  const { getToken } = useAuth();

  const fetchFeeds = useCallback(
     async() => {
      try {
        setLoading(true)
        const {data}= await api.get('/api/post/feed',{headers:{
          Authorization:`Bearer ${await getToken()}`
        }})
        
        if(data.success){
          setFeeds(data.posts)
        }else{
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
      setLoading(false)
    }
    ,[getToken]);

  useEffect(()=>{
    fetchFeeds()
  },[fetchFeeds])

  return !loading ? (
    <div className='h-full overflow-y-scroll py-10 no-scrollbar xl:pr-5 flex items-start justify-center xl:gap-8'>
      {/* {Stories and post list} */}
      <div>
        <StoriesBar/>
        <div className='p-4 space-y-6'>
          {feeds.map((post)=>(
            <PostCard 
              key={post._id} 
              post={post}
              onDeletePost={(deletedId) => setFeeds(prev => prev.filter(p => p._id !== deletedId))}
            />
          ))}
        </div>
      </div>
      {/* {right sidebar} */}
      <div className='max-xl:hidden sticky top-0 '>
          <div className='max-w-xs bg-white text-xs p-4 rounded-md shadow-md'>
            <h3 className='text-slate-800 font-semibold mb-2'>Sponsored</h3>
            <a 
              href="https://www.udemy.com/course/java-the-complete-java-developer-course/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <img 
                src="https://vtiacademy.edu.vn/upload/images/artboard-1-copy-7-100.jpg"
                alt="Quảng cáo khóa học Java" 
                className='w-full h-40 object-cover rounded-md mb-2' // <-- Sửa class để ảnh đẹp hơn
              />
              
              <p className='text-slate-700 font-semibold group-hover:text-blue-600 transition-colors'>
                Khóa học Java Toàn diện 2025
              </p>
              <p className='text-slate-600'>
                Học Java từ cơ bản đến nâng cao, xây dựng 8 dự án thực tế. Bắt đầu ngay!
              </p>
            </a>
          </div>
          <RecentMessages/>
      </div>
    </div>

  ): 
  <Loading/>
}

export default Feed
