import jwt from 'jsonwebtoken';

export const login = (req,res) => {
    const {user , pass} = req.body;
    if(user !== process.env.ADMIN_USERNAME || pass !== process.env.ADMIN_PASSWORD){
        return res.status(401).json({
            msg: "Invalid Credentials"
        })
    }

    const token = jwt.sign(
        {user},process.env.JWT_SECRET
    )

    res.json({
        msg: "Login Succesful",
        token
    })


}