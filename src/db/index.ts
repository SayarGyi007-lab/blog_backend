import mongoose from "mongoose"

export const connectDb = async()=>{
    try {
        let db_Connection = ''
        if(process.env.NODE_ENV === "development"){
            db_Connection = process.env.MONGO_LOCAL_URI!
        }
        if(process.env.NODE_ENV === "production"){
            db_Connection = process.env.MONGO_URI!
        }
        const responseDb = await mongoose.connect(db_Connection)
        console.log("Db connected successfully", responseDb.connection.host );
        
    } catch (error) {
        console.log("Error at connection Db",error);
        process.exit(1)
    }
}