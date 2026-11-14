import details from '../config/db.js';

export const getProducts = async (req,res) => {
    try{
        const [query] = await details.query('SELECT * FROM products WHERE is_active = TRUE');

    res.status(200).json({
        products: query
    })
    }
    catch(err){
        console.error(err.message);

        res.status(500).json({
            msg: 'Internal server error'
        });
    }
}