import express from "express";
import cors from "cors";
import details from "./config/db.js";
import adminRoutes from './routes/adminRoutes.js';
import auth from "./middlewares/authMiddleware.js";
import productRoutes from './routes/productRoutes.js';
const PORT = 3000;
const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/admin', adminRoutes);
app.use('/api/products',productRoutes);

app.get('/api/health',(req,res)=>{
    res.json({
        status: 'ok',
        msg: 'API is running'
    })
})

app.get('/api/db-test',async (req,res)=>{
      try {
        const [query] = await details.query('SELECT 1');

        res.json({
            query
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            msg: 'Database connection failed'
        });
    }
})

app.get('/api/admin/test',auth,(req,res)=>{
    res.json({
        msg: 'You are authenticated',
        admin: req.admin
    })
})

app.listen(PORT,()=>{
    console.log(`Server running on ${PORT}`)
})


