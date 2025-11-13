import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import api from '../../api/axios'

const initialState ={
    messages: []
}

export const fetchMessages= createAsyncThunk('messages/fetchMessages',async({token,userId})=>{
    const {data}=await api.post('/api/message/get',{to_user_id:userId},{
        headers:{Authorization:`Bearer ${token}`}
    })
    return data.success ? data:null
})

const messagesSlice = createSlice({
    name:'messages',
    initialState,
    reducers:{
        setMessages:(state,action)=>{
            state.messages=action.payload;
        },
        addMessage:(state,action)=>{
            // Reducer này BÂY GIỜ ĐÃ ĐÚNG,
            // vì nó thêm tin mới nhất vào CUỐI mảng (đã được sắp xếp cũ->mới)
            state.messages=[...state.messages,action.payload]
        },
        resetMessages:(state)=>{
            state.messages=[];
        }
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchMessages.fulfilled,(state,action)=>{
            if(action.payload){
                // ==================== SỬA ĐỔI CHÍNH ====================
                // Dữ liệu từ API đang là [Mới nhất, Cũ hơn, Cũ nhất]
                // Chúng ta .reverse() để state Redux luôn là [Cũ nhất, Cũ hơn, Mới nhất]
                const chronologicalMessages = action.payload.messages.reverse();
                state.messages = chronologicalMessages;
                // ========================================================
            }
        })
    }
})

export const {setMessages,addMessage,resetMessages}=messagesSlice.actions

export default messagesSlice.reducer