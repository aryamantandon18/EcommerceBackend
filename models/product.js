import mongoose from 'mongoose'

const productSchema = mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter the product Name"],
    },
    description:{
        type: String,
        required:[true,"please enter the product description"],
    },
    price:{
        type:Number,
        required:[true,"Enter the price of the product"],
        maxLength:[8,"Price cannot exceed 8 characters"]
    },
    rating:{
        type:Number,
        default:0
    },
    images:[
        {
            public_id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required:true
            }
        }
    ],
    videos:[
        {
            public_id:{type: String},
            src:{type: String}
        }
    ],
    category:{
        type:String,
        required:[true,"Please enter the product category"]
    },
    stock:{
        type:Number,
        maxLength:[4,"Stock cannot exceed 4 characters"],
        default:1
    },  
    numOfReviews:{
        type:Number,
        default:0
    },
    reviews:[
        {
        user:{
                type:mongoose.Schema.ObjectId,
                ref:"user",
                required:true,
            },
        name:{
            type:String,
            required:true
        },
        rating:{
            type:Number,
            required:true
        },
        comment:{
            type:String,
            required:true
        },
        createdAt: {
            type: Date,
            default: Date.now,  // ✅ Automatically set review creation date
        },
} ],   
    user:{
        type:mongoose.Schema.ObjectId,
        ref:"user",
    }

},
{
    timestamps: true
})
const Product = mongoose.model('Product',productSchema)
export default Product
