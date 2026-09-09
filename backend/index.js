import express from "express"; 
import dotenv from "dotenv"; 

dotenv.config();
const port = process.env.PORT;

const app = express();
app.get("/", (req, res) => {
    res.json({
        success: true, 
        message: "Server is running", 
        data: null
    })
})
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
    
} )