import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: String, ref: 'User', required: true }, // Sửa thành String
    content: { type: String, trim: true, required: true },
}, { timestamps: true });

export default mongoose.model('Comment', CommentSchema);