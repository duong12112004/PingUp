import mongoose from "mongoose";

const connectDB=async()=>{
    try{
        const dbUrl = process.env.MONGODB_URL;


        console.log("-----------------------------------------");
        console.log("ỨNG DỤNG ĐANG KẾT NỐI ĐẾN:", dbUrl);
        console.log("-----------------------------------------");

        
        mongoose.connection.on('connected', ()=> console.log('Database connected')) 
        await mongoose.connect(`${process.env.MONGODB_URL}/pingup`)
    } catch(error){
        console.log(error.message)
    }
}

export default connectDB