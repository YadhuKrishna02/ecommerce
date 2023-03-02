const user = require("../models/connection");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const ObjectId = require("mongodb").ObjectId;
const { Convert } = require("easy-currencies");

const otp = require("../otp/otp");
const Razorpay = require('razorpay');
const razorpay = require('../otp/razorpay');
const {  wishlist } = require("../models/connection");
const { resolve } = require("path");
const { editeduploads } = require("../multer/multer");
let instance = new Razorpay({
  key_id: 'rzp_test_PhFuqLgHsH5Ajz',
  key_secret: 'UXvzfAkrkdiOg59z8kkBDaUJ',
});

const client = require("twilio")(otp.accountId, otp.authToken);

let number;
module.exports = {
  doSignUp: (userData) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      try {
        email = userData.email;
        existingUser = await user.user.findOne({ email });
        if (existingUser) {
          response = { emailStatus: true };
          resolve(response);
        } else {
          let hashedPassword = await bcrypt.hash(userData.password, 10);
          const data = new user.user({
            username: userData.username,
            Password: hashedPassword,
            email: userData.email,
            phonenumber: userData.phonenumber,
          });
          await data.save(data).then((data) => {
            resolve({ data, emailStatus: false });
          });
        }
      } catch (err) {
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let users = await user.user.findOne({ email: userData.email });
        if (users) {
          if (users.blocked == false) {
            await bcrypt
              .compare(userData.password, users.Password)
              .then((status) => {
                if (status) {
                  id = users._id;
                  userName = users.username;

                  resolve({ id, response, loggedInStatus: true });
                } else {
                  resolve({ loggedInStatus: false });
                }
              });
          } else {
            resolve({ blockedStatus: true });
          }
        } else {
          resolve({ loggedInStatus: false });
        }
      } catch (err) {
      }
    });
  },

  verifyEmail:(userData)=>{

    return new Promise(async(resolve, reject) => {
      let email=await user.user.findOne({email:userData.email})
      console.log(email);
      if(email){
        resolve({status:true})
      }
      else{
        resolve({status:false})
      }
    })

   
  },
  verifyPassword:(userData,userId)=>{

    return new Promise(async(resolve, reject) => {
      let users=await user.user.findOne({_id:userId})
      console.log(users);
      await bcrypt
      .compare(userData.password, users.Password)
      .then(async (status) => {
        if(status){
          let hashedPassword = await bcrypt.hash(userData.password2, 10);
          await user.user.updateOne(
            {_id:userId},
            {$set:{
              Password:hashedPassword
            }}
            ).then((response)=>{
              console.log(response);
              resolve(response)
            })

        }
      });
    })

   
  },


  documentCount:()=>{
    return new Promise(async(resolve, reject) => {
      await user.product.find().countDocuments().then((documents) => {
        
        resolve(documents);
    })
    })},

  shopListProduct: (pageNum) => {
     
     let perPage=6
     return new Promise(async (resolve, reject) => {
      
       
         
        await user.product.find().skip((pageNum-1)*perPage).limit(perPage).then((response)=>{
         
           resolve(response)
         })
         
       
     })
   },
  productDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      await user.product.find({ _id: proId }).then((response) => {
        resolve(response);
      });
    });
  },

  getUserdetails:(profileId)=>{
    return new Promise(async (resolve, reject) => {
      user.address
        .findOne({userid:profileId})
        .then((response) => {
          resolve(response);
        });
    });
  },

  changeProfile:(profileId,editedData)=>{

    return new Promise(async (resolve, reject) => {
       user.address.
        updateOne(
          { userid: profileId},
          {
            $set: {
              "Address.0.fname":editedData.fname,
              "Address.0.lname":editedData.lname,
              "Address.0.email":editedData.email,
              "Address.0.mobile":parseInt(editedData.phone),
              "Address.0.street":editedData.address

            },
          }
        )
        .then((response) => {
          resolve(response);
        });
    });
  },
  //WISHLIST
  addToWishlist: async(proId, userId) => {
    
    const proObj = {
      productId: proId
    };

    return new Promise(async (resolve, reject) => {
      let wishlist = await user.wishlist.findOne({ user: userId });
      if (wishlist) {
        let productExist = wishlist.wishlistItems.findIndex(
          (item) => item.productId == proId
        );
         if(productExist==-1){
          user.wishlist
          .updateOne(
            { user: userId},
            {
              $addToSet:{
                wishlistItems:proObj
              },
            }
          )
          .then(() => {
            resolve();
          });
         }
        
      } else {
        const newWishlist = new user.wishlist({
          user: userId,
          wishlistItems:proObj
        });
      
        await newWishlist.save().then((data) => {
          resolve(data);
        });
      }
    });
  },
  
  getWishCount: (userId) => {
    console.log('api called');
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wishlist = await user.wishlist.findOne({ user: userId })
      if (wishlist) {
        count = wishlist.wishlistItems.length
      }
      resolve(count)

    })
  },
    


  addToCart: (proId, userId) => {
    proObj = {
      productId: proId,
      Quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let carts = await user.cart.findOne({ user: userId });
      if (carts) {
        let productExist = carts.cartItems.findIndex(
          (cartItems) => cartItems.productId == proId
        );
        if (productExist != -1) {
          user.cart
            .updateOne(
              { user: userId, "cartItems.productId": proId },
              {
                $inc: { "cartItems.$.Quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          await user.cart
            .updateOne(
              { user: userId },
              {
                $push: {
                  cartItems: proObj,
                },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
      } else {
        let cartItems = new user.cart({
          user: userId,

          cartItems: proObj,
        });
        await cartItems.save().then((data) => {

          resolve(data);
        });
      }
    });
  },
  viewWishlist: (userId) => {
    return new Promise(async (resolve, reject) => {
      const id = await user.wishlist
        .aggregate([
          {
            $match: {
              user: ObjectId(userId),
            },
          },
          {
            $unwind: "$wishlistItems",
          },

          {
            $project: {
              item: "$wishlistItems.productId",
            },
          },

          {
            $lookup: {
              from: "products",
              localField: "item",
              foreignField: "_id",
              as: "wish",
            },
          },
          {
            $project: {
              item: 1,
              wishlistItems: { $arrayElemAt: ["$wish", 0] },
            },
          },
        ])
        .then((wishlistItems) => {

          resolve(wishlistItems);
        });
    });
  },
  viewCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      const id = await user.cart
        .aggregate([
          {
            $match: {
              user: ObjectId(userId),
            },
          },
          {
            $unwind: "$cartItems",
          },

          {
            $project: {
              item: "$cartItems.productId",
              quantity: "$cartItems.Quantity",
            },
          },

          {
            $lookup: {
              from: "products",
              localField: "item",
              foreignField: "_id",
              as: "carted",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              cartItems: { $arrayElemAt: ["$carted", 0] },
            },
          },
        ])
        .then((cartItems) => {

          resolve(cartItems);
        });
    });
  },
  getCartItemsCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await user.cart.findOne({ user: userId });
      if (cart) {
        count = cart.cartItems.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (data) => {
    count = parseInt(data.count);
    quantity = parseInt(data.quantity);
    return new Promise((resolve, reject) => {
      if (count == -1 && quantity == 1) {
        user.cart
          .updateOne(
            { _id: data.cart },
            {
              $pull: { cartItems: { productId: data.product } },
            }
          )
          .then(() => {
            resolve({ removeProduct: true });
          });
      } else {
        user.cart
          .updateOne(
            { _id: data.cart, "cartItems.productId": data.product },
            {
              $inc: { "cartItems.$.Quantity": count },
            }
          )
          .then(() => {
            resolve({ status: true });
          });
      }
    });
  },
  totalCheckOutAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      const id = await user.cart
        .aggregate([
          {
            $match: {
              user: ObjectId(userId),
            },
          },
          {
            $unwind: "$cartItems",
          },

          {
            $project: {
              item: "$cartItems.productId",
              quantity: "$cartItems.Quantity",
            },
          },

          {
            $lookup: {
              from: "products",
              localField: "item",
              foreignField: "_id",
              as: "carted",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$carted", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .then((total) => {
          resolve(total[0]?.total);
        });
    });
  },
  deleteCart: (data) => {
    return new Promise((resolve, reject) => {
      user.cart
        .updateOne(
          { _id: data.cartId },
          {
            $pull: { cartItems: { productId: data.product } },
          }
        )
        .then(() => {
          resolve({ removeProduct: true });
        });
    });
  },

  getCardProdctList:(userId)=>{
    return new Promise(async(resolve, reject) => {
     
      
          let id = user.cart.aggregate([
      
            {
              $match: {
                user:ObjectId(userId)
              }
            },
            {
             $unwind: '$cartItems'
            },
                
          {
              $project: {
                  item: '$cartItems.productId',
                _id:0
              }
          },
      
          ]).then((result)=>
          {
            resolve(result)
          })
         
        })
      
    
  

  },
  category:(categoryName)=>{
    return new Promise(async (resolve, reject) => {
      await user.product.find({category:categoryName}).then((response)=>{
        resolve(response)
      })
    })

  },
  checkOutpage: (userId) => {
    return new Promise(async (resolve, reject) => {

      await user.address.aggregate([
        {
          $match: {
            userid: ObjectId(userId)
          }
        },
        {
          $unwind: '$Address'
        },

        {
          $project: {
            item: '$Address'

          }
        },

        {
          $project: {
            item: 1,
            Address: { $arrayElemAt: ['$Address', 0] }
          }
        }

      ]).then((address) => {


        resolve(address)
      })


    })
  },
  placeOrder: (orderData, total) => {
    return new Promise(async (resolve, reject) => {

      let productdetails = await user.cart.aggregate([
        {
          $match: {
            user: ObjectId(orderData.user)
          }
        },
        {
          $unwind: '$cartItems'
        },


        {
          $project: {
            item: '$cartItems.productId',
            quantity: '$cartItems.Quantity',

          }
        },

        {
          $lookup: {
            from: 'products',
            localField: "item",
            foreignField: "_id",
            as: 'productdetails'
          }
        },
        {
          $unwind: '$productdetails'
        },
        {
          $project: {
            image: '$productdetails.Image',
            category: '$productdetails.category',
            _id: "$productdetails._id",
            quantity: 1,
            productsName: "$productdetails.Productname",
            productsPrice: "$productdetails.Price",

          }
        }
      ])
   
   let address= await user.address.aggregate([
        {
          $match: {
            userid: ObjectId(orderData.user)
          }
        },
        {
          $unwind: '$Address'
        },

        {
          $project: {
            item: '$Address'

          }
        },

        {
          $project: {
            item: 1,
            }
          },
         

      ])
      
      orderaddress=address[0].item;
    
      let status = orderData['payment-method'] === 'COD' ? 'paid' : 'pending'
    
      let orderdata = {

        name:orderaddress.fname,
        paymentStatus: status,
        paymentmode:orderData['payment-method'],
        paymenmethod: orderData['payment-method'],
        productDetails: productdetails,
        shippingAddress: orderaddress,
        totalPrice: total
      }


      let order = await user.order.findOne({ userid: orderData.user })

      if (order) {
        await user.order.updateOne({ userid: orderData.user },
          {
            '$push':
            {
              'orders': orderdata
            }
          }).then((productdetails) => {

            resolve(productdetails)
          })
      } else {
        let newOrder = user.order({
          userid: orderData.user,
          orders: orderdata
        })

        await newOrder.save().then((orders) => {
          resolve(orders)
        })
      }
         await  user.cart.deleteMany({ user: orderData.user }).then(()=>{
          resolve()
         })
    
    })
  },

  createData:(details,dates)=>
  {
    let address = details.address[0]
    let product = details.products[0][0]
    let orderDetails = details.details.createdAt
  
    console.log('orderdetails',orderDetails);
    let myDate=dates(orderDetails);

    let data = {
      // Customize enables you to provide your own templates
      // Please review the documentation for instructions and examples
      customize: {
        //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
      },
      images: {
        // The logo on top of your invoice
        logo: "https://cdn.freelogodesign.org/files/ff0105e7b374444a99ea2be533fd7d6d/thumb/logo_200x200.png?v=0",
        // The invoice background
 
      },
      // Your own data
      sender: {
        company: "WHITE SPARROW",
        address: "Bournivilla tower",
        zip: "4567 CD",
        city: "Los santos",
        country: "America",
       
      },
      // Your recipient
      client: {
    
        company: address.fname,
        address: address.street,
        zip: address.pincode,
        city: address.city,
        country: "India",
      },

      information: {
        number: address.mobile,
        date:myDate,
        "due-date":myDate
        
      },

      products: [
        {
          quantity: product.quantity,
          description: product.productsName,
          "tax-rate": 0,
          price: product.productsPrice,
        },
      ],
      // The message you would like to display on the bottom of your invoice
      "bottom-notice": "Thank you for your order from WHITE SPARROW",
      // Settings to customize your invoice
      settings: {
        currency: "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
        // "locale": "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')
        // "tax-notation": "gst", // Defaults to 'vat'
        // "margin-top": 25, // Defaults to '25'
        // "margin-right": 25, // Defaults to '25'
        // "margin-left": 25, // Defaults to '25'
        // "margin-bottom": 25, // Defaults to '25'
        // "format": "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
        // "height": "1000px", // allowed units: mm, cm, in, px
        // "width": "500px", // allowed units: mm, cm, in, px
        // "orientation": "landscape", // portrait or landscape, defaults to portrait
      },
      // Translate your invoice to your preferred language
      translate: {
        // "invoice": "FACTUUR",  // Default to 'INVOICE'
        // "number": "Nummer", // Defaults to 'Number'
        // "date": "Datum", // Default to 'Date'
        // "due-date": "Verloopdatum", // Defaults to 'Due Date'
        // "subtotal": "Subtotaal", // Defaults to 'Subtotal'
        // "products": "Producten", // Defaults to 'Products'
        // "quantity": "Aantal", // Default to 'Quantity'
        // "price": "Prijs", // Defaults to 'Price'
        // "product-total": "Totaal", // Defaults to 'Total'
        // "total": "Totaal" // Defaults to 'Total'
      },
    };

    return data;
  },
  generateRazorpay: (userId, total) => {

    return new Promise(async (resolve, reject) => {

      let orders = await user.order.find({ userid: userId })
      let order = orders[0].orders.slice().reverse()
      let orderId = order[0]._id
      total = total * 100
      let options = {
        amount: parseInt(total),
        currency: "INR",
        receipt: "" + orderId,
      }  
      instance.orders.create(options, function (err, order) {
        if (err) {
        } else {
          resolve(order)
        }
      })

    })
  },
  
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      try {
        const crypto = require('crypto')
        let hmac = crypto.createHmac('sha256', razorpay.secret_id)
        hmac.update(details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]'])
        hmac = hmac.digest('hex')
        if (hmac == details['payment[razorpay_signature]']) {
          resolve()
        } else {
          reject("not match")
        }
      } catch (err) {
      }
    })



  },
  changePaymentStatus: (userId, orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await user.order.find({ userId: userId })

        let orderIndex = orders[0].orders.findIndex(order => order._id == orderId)
        await user.order.updateOne(
          {
            'orders._id': ObjectId(orderId)
          },
          {
            $set: {
              ['orders.' + orderIndex + '.paymentStatus']: 'PAID'
            }
          }
        ),
          await user.cart.deleteMany({ userid: orderId })
            .then(() => {

              resolve()

            })
      } catch (err) {
      }

    })
  },
  postAddress: (userId, data) => {
    return new Promise(async(resolve, reject) => {

      let addressInfo = {
        fname: data.fname,
        lname: data.lname,
        street: data.street,
        apartment: data.apartment,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        mobile: data.mobile,
        email: data.email,

      }
   


        let AddressInfo = await user.address.findOne({ userid: userId })
        if (AddressInfo) {


          await user.address.updateOne({ userid: userId },
            {
              "$push":
              {
                "Address": addressInfo

              }
            }).then((response) => {
              resolve(response)
            })



        } else {


          let addressData = new user.address({
            userid: userId,

            Address: addressInfo

          })

          await addressData.save().then((response) => {
            resolve(response)
          });
        }
      })
   
  },
  orderPage: (userId) => {
    return new Promise(async (resolve, reject) => {

      await user.order.aggregate([{
        $match:
          { userid: ObjectId(userId) }
      },
      {
        $unwind: '$orders'
      },
      {
        $sort: { 'orders:createdAt': -1 }
      }
      ]).then((response) => {
        resolve(response)
      })
    })

  },  
  viewOrderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {

  let productid = await user.order.findOne({ "orders._id": orderId },{'orders.$':1});

   
   let details=productid.orders[0]
   let order=productid.orders[0].productDetails
 
   const productDetails = productid.orders.map(object => object.productDetails);
   const address= productid.orders.map(object => object.shippingAddress);
   const products = productDetails.map(object => object)
     
        resolve({products,address, details,})
      
    
           
    })



  },

  cancelOrder: (orderId, userId) => {

    return new Promise(async (resolve, reject) => {

      let orders = await user.order.find({ 'orders._id': orderId })

    

      let orderIndex = orders[0].orders.findIndex(orders => orders._id == orderId);
      console.log(orderIndex + "order..................");

      await user.order.updateOne({ 'orders._id': orderId },
        {
          $set:
          {
            ['orders.' + orderIndex + '.orderStatus']: 'cancelled'

          }


        }).then((orders) => {
          resolve(orders)
        })

    })


  },
  returnOrder: (orderId, userId) => {

    return new Promise(async (resolve, reject) => {

      let orders = await user.order.find({ 'orders._id': orderId })

    

      let orderIndex = orders[0].orders.findIndex(orders => orders._id == orderId)

      await user.order.updateOne({ 'orders._id': orderId },
        {
          $set:
          {
            ['orders.' + orderIndex + '.orderStatus']: 'returned'

          }


        }).then((orders) => {
          resolve(orders)
        })

    })


  },


  searchProduct:(product)=>{
    return new Promise(async(resolve, reject) => {
    
  

    resolve(search)
      
    })
  }

};
