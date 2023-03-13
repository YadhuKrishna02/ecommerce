const mongoose = require("mongoose");
const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
    required: true,
    // minlength: 5,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phonenumber: {
    type: Number,
    // minlength:10,
    unique: true,
  },
  blocked: {
    type: Boolean,
    default: false,
  },

  coupons: Array,

  CreatedAt: {
    type: Date,
    deafault: Date.now,
  },
});

const otpSchema = new mongoose.Schema({
  otp: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
});

const productSchema = new mongoose.Schema({
  Productname: {
    type: String,
  },
  ProductDescription: {
    type: String,
  },
  Quantity: {
    type: Number,
  },
  Image: {
    type: Array,
  },
  Price: {
    type: Number,
  },
  category: {
    type: String,
  },
  productActive: {
    type: Boolean,
    default: true,
  },
});
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },

  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
      Quantity: { type: Number, default: 1 },
      Price: { type: Number },
    },
  ],
});

const wishSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
  },
  wishitems: [{
    productId: { type: mongoose.Schema.Types.ObjectId },
  }],
  addedAt: {
    type: Date,
    default: Date.now
  }
});


const addressSchema = new mongoose.Schema({


  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  Address: [
    {
      fname: { type: String },
      lname: { type: String },
      street: { type: String },
      apartment: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: Number },
      mobile: { type: Number },
      email: { type: String }
    }
  ]


})
const orderSchema = new mongoose.Schema({

  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  orders: [{


    name: String,
    productDetails: Array,
    paymentMethod: String,
    paymentStatus: String,
    totalPrice: Number,
    totalQuantity: Number,
    shippingAddress: Object,
    paymentmode: String,
    status: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: new Date()
    },
    orderStatus: {
      type: String,
    },
  }
  ]
})

//coupons
const couponSchema = new mongoose.Schema({
  couponName: String,
  expiry: {
    type: Date,
    default: new Date(),
  },
  minPurchase: Number,
  discountPercentage: Number,
  maxDiscountValue: Number,
  couponApplied: {
    type: String,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  description: String,
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

//  module.exports=db

module.exports = {
  user: mongoose.model("user", userschema),
  categories: mongoose.model("categories", categorySchema),
  product: mongoose.model("product", productSchema),
  cart: mongoose.model("cart", cartSchema),
  order: mongoose.model('order', orderSchema),
  address: mongoose.model('address', addressSchema),
  coupon: mongoose.model("coupon", couponSchema),
  otp: mongoose.model("otp", otpSchema),
  wishlist: mongoose.model("wishlist", wishSchema),
  banner: mongoose.model('Banner', bannerSchema),

};
