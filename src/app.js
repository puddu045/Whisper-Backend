const express = require("express");
const connectDB = require("./config/database");
const cors = require('cors');
const authRouter = require("./Routes/userRoute");
const postRouter = require("./Routes/postRoute");
const commentRouter = require("./Routes/commentRoute");
const cookieParser = require("cookie-parser")




const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(cors({
    origin:"http://localhost:5173",
    credentials : true
}
))

app.use("/", authRouter)
app.use("/", postRouter)
app.use("/", commentRouter)

connectDB().then(()=>{
    console.log("Database connected...")
    app.listen(4545, ()=>{
        console.log("Server runninng on port 4545")
    });
}).catch(err =>{
    console.error("DB not connected")
})
