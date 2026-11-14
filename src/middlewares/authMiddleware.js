import jwt from 'jsonwebtoken'

const auth = (req,res,next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if(!token){
        return res.status(401).json({
            msg: 'Access Denied'
        })
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        req.admin = decoded

        next();
    } catch(err){
        return res.status(401).json({
            msg: "Invalid token"
        })
    }
}

export default auth