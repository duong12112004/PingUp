import { useEffect, useState } from 'react'
import { UserPlus,UserCheck,UserRoundPen,MessageSquare, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import { useAuth } from '@clerk/clerk-react'

import { fetchConnections } from '../features/connections/connectionsSlice'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Button from '../components/Button'

const Connections = () => {

  const [currentTab, setCurrentTab] = useState('followers');

  const navigate = useNavigate();
  const { getToken } = useAuth();
  const dispatch = useDispatch();


  const { connections, pendingConnections, followers, following } = useSelector((state)=>state.connections);

  // Local copies to allow optimistic UI updates
  const [localConnections, setLocalConnections] = useState([])
  const [localPending, setLocalPending] = useState([])
  const [localFollowers, setLocalFollowers] = useState([])
  const [localFollowing, setLocalFollowing] = useState([])

  const dataArray=[
    {key: 'followers', label: 'Người theo dõi', value:followers, icon:Users},
    {key: 'following', label: 'Đang theo dõi', value:following, icon:UserCheck},
    {key: 'pending', label: 'Đang chờ', value:pendingConnections, icon:UserRoundPen},
    {key: 'connections', label: 'Bạn bè', value:connections, icon:UserPlus},
  ];

  const handleUnfollow = async (userId)=>{
    try {
      const {data} =await api.post('/api/user/unfollow',{id:userId},{
        headers: {Authorization: `Bearer ${await getToken()}`}
      })
      if(data.success){
        toast.success(data.message)
        // Optimistically update localFollowing immediately
        setLocalFollowing(prev => prev.filter(u => u._id !== userId))
        // Also refresh connections from server to keep store in sync
        dispatch(fetchConnections(await getToken()))
      }else{
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }


  const acceptConnection = async (userId)=>{
    try {
      const {data} =await api.post('/api/user/accept',{id:userId},{
        headers: {Authorization: `Bearer ${await getToken()}`}
      })
      if(data.success){
        toast.success(data.message)
        dispatch(fetchConnections(await getToken()))
      }else{
        toast(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    getToken().then((token)=>{
      dispatch(fetchConnections(token))
    })
  },[getToken,dispatch])

  // Sync local copies whenever redux state changes
  useEffect(() => {
    setLocalConnections(connections || [])
    setLocalPending(pendingConnections || [])
    setLocalFollowers(followers || [])
    setLocalFollowing(following || [])
  }, [connections, pendingConnections, followers, following])

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto p-6 '>

        {/* {title } */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>
          Kết nối</h1>
          <p className='text-slate-600'>Quản lý bạn bè và tìm kiếm các mối quan hệ mới </p>
        </div>

        {/* {Counts} */}
        <div className='mb-8 flex flex-wrap gap-6'>
          {
            dataArray.map((item,index)=>(
              <div key={index} className='flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md'>
                  <b>{item.value.length}</b>
                  <p className='text-slate-600'>{item.label}</p>
              </div>
            ))
          }
        </div>

        {/* {Tabs} */}
        <div className='inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm'>
          {
            dataArray.map((tab)=>(
              <button onClick={()=>setCurrentTab(tab.key)} key={tab.key}  className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${currentTab===tab.key ? 'bg-white font-medium text-black' : 'text-gray-500 hover:text-black'}`}>
                  <tab.icon className='w-4 h-4' />
                  <span className='ml-1'>{tab.label}</span>
                  {
                    tab.count !== undefined &&(
                      <span className='ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full '>{tab.count}</span>
                    )
                  }
              </button>
            ))
          }
        </div>

        {/* {Connections} */}
        <div className='flex flex-wrap gap-6 mt-6'>
            {
              dataArray.find((item)=>item.key === currentTab).value.map((user)=>(
                <div key={user._id} className='w-full max-w-88 flex gap-5 p-6 bg-white shadow rounded-md'>
                  <img src={user.profile_picture} alt="" className='rounded-full w-12 h-12 shadow-md mx-auto'/>
                  <div className='flex-1'>
                    <p className='font-medium text-slate-700'>{user.full_name}</p>
                    <p className='text-slate-500'>@{user.username}</p>
                    <p className='text-sm text-gray-600'>{user.bio.slice(0,30)}...</p>
                    <div className='flex max-sm:flex-col gap-2 mt-4 '>
                      {
                        <Button onClick={()=>navigate(`/profile/${user._id}`)}  className='w-full text-sm'>
                          Xem trang cá nhân
                        </Button>
                      }
                      {
                        currentTab === 'following' &&(
                          <Button onClick={()=>handleUnfollow(user._id)} variant='secondary' className='w-full text-sm'>
                            Bỏ theo dõi
                          </Button>
                        )
                      }
                      {
                        currentTab === 'pending' &&(
                          <Button onClick={()=>acceptConnection(user._id)} variant='secondary' className='w-full text-sm'>
                            Chấp nhận
                          </Button>
                        )
                      }
                      {
                        currentTab === 'connections' &&(
                          <Button onClick={()=>navigate(`/messages/${user._id}`)} variant='secondary' className='w-full text-sm'>
                            <MessageSquare className='w-4 h-4 '/>
                              Nhắn tin
                            </Button>
                        )
                      }
                    </div>
                  </div>
                </div>
              ))
            }
        </div>
      </div>
      
    </div>
  )
}

export default Connections
