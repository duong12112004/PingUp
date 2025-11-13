


import imagekit from "../configs/imageKit.js"
import { inngest } from "../inngest/index.js"
import Connection from "../models/Connection.js"
import Post from "../models/Post.js"
import User from "../models/User.js"
import fs from 'fs'

// Get User Data using userId
export const getUserData= async (req, res) => {
    try {
        const {userId} =req.auth()
        const user = await User.findById(userId)
        if(!user){
            return res.json({success: false,message :"Không tìm thấy người dùng"})
        }
        res.json({success: true,user})
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

// Update User Data
export const updateUserData = async (req, res) => {
    try {
        const {userId} =req.auth()
        let {username,bio , location, full_name}=req.body;

        const temUser =await User.findById(userId)

        !username && (username=temUser.username)
        if(temUser.username !== username){
            const user=await User.findOne({username})
            if(user){
                //we will not change the username if it is already taken
                username =temUser.username
            }
        }
        const updatedData= {
            username,
            bio,
            location,
            full_name
        }

        const profile= req.files.profile && req.files.profile[0]
        const cover= req.files.cover && req.files.cover[0]

        if(profile){
            const buffer =fs.readFileSync(profile.path)
            const response=await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            })
            const url =imagekit.url({
                path: response.filePath,
                transformation:[
                    {quality:'auto'},
                    {format: 'webp'},
                    {width: '512'}
                ]
            })
            updatedData.profile_picture=url;
        }

        if(cover){
            const buffer =fs.readFileSync(cover.path)
            const response=await imagekit.upload({
                file: buffer,
                fileName: cover.originalname,
            })
            const url =imagekit.url({
                path: response.filePath,
                transformation:[
                    {quality:'auto'},
                    {format: 'webp'},
                    {width: '1280'}
                ]
            })
            updatedData.cover_photo=url;
        }

        const user = await User.findByIdAndUpdate(userId,updatedData,{new:true})

        res.json({success:true, user, message:'Đã cập nhật hồ sơ thành công'})
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

// find users using username, email, location, name

export const discoverUser = async (req, res) => {
    try {
        const {userId} =req.auth()
        const {input} = req.body;

        const allUsers =await User.find(
            {
                $or: [
                    {username: new RegExp(input,'i')},
                    {email: new RegExp(input,'i')},
                    {full_name: new RegExp(input,'i')},
                    {location: new RegExp(input,'i')},
                ]
            }
        )
        const filteredUsers= allUsers.filter(user=>user._id !== userId)

        res.json({success: true, users:filteredUsers})
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

// Follow User

export const followUser = async (req, res) => {
    try {
        const {userId} =req.auth()
        const {id} = req.body;

        const user =await User.findById(userId)

        if(user.following.includes(id)){
            return res.json({success: false , message: 'Bạn đã theo dõi người dùng này rồi'})
        }
        user.following.push(id);
        await user.save()

        const toUser= await User.findById(id)
        toUser.followers.push(userId)
        await toUser.save()

        res.json({success: true , message: 'Bạn đã bắt đầu theo dõi người dùng này'})
       
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

// Unfollow User

export const unfollowUser = async (req, res) => {
    try {
        const {userId} =req.auth()
        const {id} = req.body;

        const user =await User.findById(userId)
        user.following =user.following.filter(user=>user !== id);
        await user.save()

        const toUser =await User.findById(id)
        toUser.followers =toUser.followers.filter(user=>user !== userId);

        await toUser.save()

        res.json({success: true , message: 'Bạn đã bỏ theo dõi người dùng này', following: user.following, followers: toUser.followers})
        
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

// Send Connection Request

export const sendConnectionRequest =async (req,res)=>{
    try {
        const {userId} =req.auth()
        const {id} =req.body;

        // check if user sent more than 20 connection request in last 24 hours

        const last24Hours =new Date(Date.now() - 24 * 60 * 60 * 1000)
        const connectionRequests= await Connection.find({from_user_id: userId, createdAt: {$gt: last24Hours}})
        if(connectionRequests.length >=20){
            return res.json({success: false,message: 'Bạn đã gửi quá 20 lời mời kết nối trong 24 giờ qua'})
        }

        //check if users are already conected

        const connection= await Connection.findOne({
            $or: [
                {from_user_id: userId, to_user_id: id},
                {from_user_id: id, to_user_id: userId}
            ]
        })

        if(!connection){
            const newConnection= await Connection.create({
                from_user_id:userId,
                to_user_id:id
            })

            await inngest.send({
                name:'app/connection-request',
                data: {connectionId:newConnection._id}
            })

            return res.json({success:true , message:'Đã gửi lời mời kết bạn thành công'})
        }else if(connection && connection.status === 'accepted'){
            return res.json({success:false , message:'Bạn đã kết bạn với người dùng này rồi'})
        }

        return res.json({success:false , message:'Yêu cầu kết bạn đang chờ xử lý'})
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

// Get User Connections

export const getUserConnections =async (req,res)=>{
    try {
        const {userId} =req.auth()
        const user =await User.findById(userId).populate('connections followers following')
        
    if (!user) {
      return res.json({ success: false, message: 'User không tồn tại hoặc đã bị xóa' });
    }
        const connections =user.connections
        const followers= user.followers
        const following=user.following

       const pendingConnections =(await Connection.find({to_user_id:userId, status:'pending'}).populate('from_user_id')).map(connection=>connection.from_user_id)

       res.json({success:true ,connections, followers,following, pendingConnections})
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

// Accept Connection Request
export const acceptConnectionRequest =async (req,res)=>{
    try {
        const {userId} =req.auth()
        const {id} = req.body;

        const connection= await Connection.findOne({from_user_id:id, to_user_id:userId})

        if(!connection){
            return res.json({success: false, message: 'Không tìm thấy lời mời kết bạn'});
        }

        const user =await User.findById(userId);
        user.connections.push(id);
        await user.save()

        const toUser =await User.findById(id);
        toUser.connections.push(userId);
        await toUser.save()

        connection.status ='accepted';
        await connection.save()

        res.json({success: true, message: 'Đã chấp nhận kết bạn thành công'});
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

//Get User Profiles

export const getUserProfiles =async (req,res)=>{
    try {
        const {profileId}=req.body;
        const profile=await User.findById(profileId)
        if(!profile){
            return res.json({success:false, message:"Không tìm thấy hồ sơ"});
        }
        const posts = await Post.find({user:profileId}).populate('user')
        res.json({success:true,profile,posts})
    } catch (error) {
        console.log(error);
        res.json({success: false,message :error.message})
    }
}

export const removeConnection = async (req, res) => {
  try {
    // Giả sử middleware xác thực của bạn lưu ID người dùng vào req.auth.userId
    const currentUserId = req.auth.userId; 
    const userToUnfriendId = req.body.id;

    if (!userToUnfriendId) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy ID người dùng' });
    }

    // 1. Xóa người B khỏi danh sách bạn bè của người A
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { connections: userToUnfriendId }
    });

    // 2. Xóa người A khỏi danh sách bạn bè của người B
    await User.findByIdAndUpdate(userToUnfriendId, {
      $pull: { connections: currentUserId }
    });

    // 3. (Tùy chọn) Xóa bản ghi Connection đã chấp nhận
    await Connection.findOneAndDelete({
      status: 'accepted',
      $or: [
        { from_user_id: currentUserId, to_user_id: userToUnfriendId },
        { from_user_id: userToUnfriendId, to_user_id: currentUserId }
      ]
    });

    return res.status(200).json({ success: true, message: 'Đã hủy kết bạn thành công' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};