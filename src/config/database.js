import mongoose from 'mongoose';

function connectDB(){
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB');
})
}

export default connectDB;
