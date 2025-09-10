import React, { useEffect, useState } from 'react'
import { assets, dummyPostsData } from '../assets/assets'
import Loading from '../components/Loading'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import RecentMessages from '../components/RecentMessages'

const Feed = () => {
  const [feeds,setfeeds]=useState([])
  const [loading,setLoading]=useState(true)

  const fetchFeeds=async()=>{
    setfeeds(dummyPostsData)
    setLoading(false)
  }

  useEffect(()=>{
    fetchFeeds()
  },[])

  return !loading ? (
    <div className='h-full overflow-y-scroll py-10 no-scrollbar xl:pr-5 flex items-start justify-center xl:gap-8'>
      {/* {Stories and post list} */}
      <div>
        <StoriesBar/>
        <div className='p-4 space-y-6'>
          {feeds.map((post)=>(
            <PostCard key={post._id} post={post}/>
          ))}
        </div>
      </div>
      {/* {right sidebar} */}
      <div className='max-xl:hidden sticky top-0 '>
          <div className='max-w-xs bg-white text-xs p-4 rounded-md'>
            <h3 className='text-slate-800 font-semibold'>sponsored</h3>
            <img src={assets.sponsored_img} alt="" className='w-75 h-50 rounded-md'/>
            <p className='text-slate-600'>Email marketing</p>
            <p className='text-slate-600'>Supercharge your marketing with a powerful, easy-to-use platform built for result.</p>
          </div>
          <RecentMessages/>
      </div>
    </div>

  ): 
  <Loading/>
}

export default Feed
