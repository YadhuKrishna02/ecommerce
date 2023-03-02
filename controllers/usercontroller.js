require('dotenv').config()
const userhelpers = require("../helpers/userhelpers");
const couponHelpers = require("../helpers/couponHelpers");
const user = require("../models/connection");
const otp = require("../otp/otp");
const ObjectId = require("mongodb").ObjectId;
const adminHelper = require("../helpers/adminHelpers");
const { response } = require("../app");
const { wishlist } = require("../models/connection");
const { Convert } = require("easy-currencies");
const paypal = require('@paypal/checkout-server-sdk')
const Environment =
    process.env.NODE_ENV === "production"
        ? paypal.core.LiveEnvironment
        : paypal.core.SandboxEnvironment
const paypalClient = new paypal.core.PayPalHttpClient(
    new Environment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
    )
)

const client = require("twilio")(otp.accountId, otp.authToken);

let userSession, number, loggedUser,profileId,userDetails,userAddDetails,getDate;
let count,wishcount,
  otpNumber,total
  couponPrice = 0;

module.exports = {
  getHome: async (req, res) => {
    userSession = req.session.userLoggedIn;
    if (req.session.userLoggedIn) {
      profileId=req.session.user.id;
      count = await userhelpers.getCartItemsCount(req.session.user.id);
      res.render("user/user", { userSession,profileId, count });
    } else {
      res.render("user/user", { userSession,profileId });
    }
  },
  getUserLogin: async (req, res) => {
    count = await userhelpers.getCartItemsCount(req.session.user.id);

    userSession = req.session.userLoggedIn;

    res.render("user/user", { userSession, count,profileId });
  },
  getUserOtpLogin: (req, res) => {
    res.render("user/otplogin", { userSession,profileId });
  },
  postUserOtpLogin: async (req, res) => {
    number = req.body.number;
    let users = await user.user.find({ phonenumber: number }).exec();
    loggedUser = users;
    if (users == false) {
      res.redirect("/login");
    } else {
      client.verify.v2
        .services(otp.serviceId)
        .verifications.create({ to: `+91 ${number}`, channel: "sms" })
        .then((verification) => console.log(verification.status))
        .then(() => {
          const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
          });
        });
      res.render("user/otp-entering");
    }
  },

  postOtpVerify: async(req, res) => {
    otpNumber = req.body.otp;

    const newOTP = new user.otp({
      otp: otpNumber,
      phoneNumber: number
  });

  await newOTP.save();

    client.verify.v2
      .services(otp.serviceId)
      .verificationChecks.create({ to: `+91 ${number}`, code: otpNumber })
      .then((verification_check) => {
        if (verification_check.valid == true) {
          let id = loggedUser[0]._id;
          req.session.user = { loggedUser, id };

          req.session.userLoggedIn = true;
          userSession = req.session.userLoggedIn;

          //new

          // userhelpers.getUserDetailsNo(number).then((user) => {
          //   req.session.user = user[0]._id;
          //   userSession = req.session.user;
          // });
          res.render("user/user", { userSession,countdown:60 });
        } else {
          res.redirect("/otp_verify");
        }
      });
  },
  getOtpVerify: (req, res) => {
    res.render("user/otp-entering");
  },

  postUserLogin: (req, res) => {
    userhelpers.doLogin(req.body).then((response) => {
      let loggedInStatus = response.loggedInStatus;
      let blockedStatus = response.blockedStatus;
      if (loggedInStatus == true) {
        req.session.user = response;
        req.session.userLoggedIn = true;
        userSession = req.session.userLoggedIn;
        res.redirect("/");
      } else {
        blockedStatus;
        res.render("user/login", { loggedInStatus, blockedStatus });
      }
    });
  },
  getSignUp: (req, res) => {
    res.render("user/signup");
  },
  postSignUp: (req, res) => {
    userhelpers.doSignUp(req.body).then((response) => {
    let emailStatus = response.emailStatus;
      if (emailStatus == false) {
        res.redirect("/login");
      } else {
        res.render("user/signup", { emailStatus });
      }
    });
  },

  getPasswordReset:(req,res)=>{
      res.render("user/reset-password",{userSession,profileId})
  },
  postPasswordReset:async(req,res)=>{
   let response=await userhelpers.verifyEmail(req.body)
      res.json(response.status)
  },
  getEnterNewPwd:(req,res)=>{
    res.render("user/enter-pwd",{userSession,profileId})
    
  },
  updatePassword:async(req,res)=>{

    let passResponse=await userhelpers.verifyPassword(req.body,req.params.id);
    if(passResponse){
      res.json(true)
    }

  },


  getProfilePage:(req,res)=>{
    
     userhelpers.getUserdetails(profileId).then((response)=>{
      userAddDetails=response.Address;

       res.render("user/profile",{userSession,profileId,count,userAddDetails})
     })
          
  },

  changeProfile:(req,res)=>{
    userhelpers.changeProfile(profileId, req.body)
      .then((response) => {
        res.json(true)
      });
  },

  getShop: async (req, res) => {
    let pageNum=req.query.page 
    let currentPage=pageNum
    let perPage=6
    // let currentUserId=req.session.user.id

    count = await userhelpers.getCartItemsCount(req.session.user.id)
    viewCategory = await adminHelper.viewAddCategory()
    documentCount=  await userhelpers.documentCount()
    let pages=Math.ceil(parseInt(documentCount) /perPage)

    userhelpers.shopListProduct(pageNum).then((response) => {
      
      res.render('user/shop', { response,profileId, userSession, count, viewCategory ,currentPage,documentCount,pages})
    })


  },
  getProductDetails: async (req, res) => {
    count = await userhelpers.getCartItemsCount(req.session.user.id);

    userhelpers.productDetails(req.params.id).then((data) => {
      res.render("user/eachproduct", { userSession,profileId, data, count });
    });
  },

  getAddToCart: (req, res) => {
    userhelpers.addToCart(req.params.id, req.session.user.id).then((data) => {
      res.json({ status: true });
    });
  },
  getWishlist: async(req, res) => {
     wishcount = await userhelpers.getWishCount(profileId)
    userhelpers.addToWishlist(req.params.prodId, req.session.user.id).then((data) => {
      res.json({ status: true });
    });
  },

  viewWishlist:async(req,res)=>{

    let wishlistItems = await userhelpers.viewWishlist(req.session.user.id);
    res.render("user/wishlist",{userSession,profileId,count,wishlistItems,wishcount})
  },
  deleteWishList: (body) => {

    return new Promise(async (resolve, reject) => {

      let product = await user.wishlist.updateOne({ _id:body.wishlistId },
        {
          "$pull":

            { wishlistItems: { productId: body.productId} }
        }).then(() => {
          resolve({ removeProduct: true })
        })

      
    })
  },

  getViewCart: async (req, res) => {
    let userId = req.session.user;
     total = await userhelpers.totalCheckOutAmount(req.session.user.id);
    let count = await userhelpers.getCartItemsCount(req.session.user.id);

    let cartItems = await userhelpers.viewCart(req.session.user.id);

    res.render("user/view-cart", {
      cartItems,
      userId,
      userSession,
      profileId,
      count,
      total,
    });
  },
  postchangeProductQuantity: async (req, res) => {
    await userhelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userhelpers.totalCheckOutAmount(req.body.user);

      res.json(response);
    });
  },

  getDeleteCart: (req, res) => {
    userhelpers.deleteCart(req.body).then((response) => {
      res.json(response);
    });
  },
  

  getLogout: (req, res) => {
    req.session.user = null;
    req.session.userLoggedIn = false;

    res.redirect("/login");
  },

  deleteWishList: (req, res) => {
    userhelpers.deleteWishList(req.body).then((response)=>{
    
      res.json(response)
    
    })
      },

  checkOutPage:async (req, res) => {
    
    let users = req.session.user.id
    if (req.session.user.total) {
      total = req.session.user.total
    }
    else {

      total = await userhelpers.totalCheckOutAmount(req.session.user.id)
    }
    
    let count = await userhelpers.getCartItemsCount(req.session.user.id);
      let cartItems =  await userhelpers.viewCart(req.session.user.id)
      userhelpers.checkOutpage(req.session.user.id).then((response)=>{
      

        res.render('user/checkout',{paypalClientId: process.env.PAYPAL_CLIENT_ID,users,userSession,profileId,cartItems,total,response,count})
  })

},

postcheckOutPage:async (req, res) => {

  if (req.session.user.total) {
    total = req.session.user.total
  }
  else {

    total = await userhelpers.totalCheckOutAmount(req.session.user.id)
  }
  req.session.user.total=null
  
 let order= await userhelpers.placeOrder(req.body, total).then(async (response) => {
           
         
          
 
    if (req.body['payment-method'] == 'COD') {
      res.json({ codstatus: true })
 
    } else if(req.body['payment-method'] == 'online') {
      userhelpers.generateRazorpay(req.session.user.id, total).then((order) => {
        res.json(order)
 
      })
    }
    else{
  let value = await Convert(total).from("INR").to("USD");
  console.log(value);
  let price = Math.round(value)
      res.json({ paypal: true, price:price})
    }
  })
 
 
 },

 paypalOrder: async (req, res) => {
   let total = req.body.total
   total = parseInt(total)
  const request = new paypal.orders.OrdersCreateRequest()
  

  request.prefer("return=representation")
  request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
          {
              amount: {
                  currency_code: "USD",
                  value: total,
                  breakdown: {
                      item_total: {
                          currency_code: "USD",
                          value: total,
                      },
                  },
              }
          },
      ],
  })

  try {
      const order = await paypalClient.execute(request)
      res.json({ id: order.result.id })
  } catch (e) {
      res.status(500).json({ error: e.message })
  }
},
paypalSuccess: async (req, res) => {
  const ordersDetails = await user.order.find({ userId: profileId })
  let orders = ordersDetails[0].orders.slice().reverse()
  let orderId1 = orders[0]._id
  let orderId = "" + orderId1

  userhelpers.changePaymentStatus(req.session.user, orderId).then(() => {
      res.json({ status: true })
  })
},

 postVerifyPayment: (req, res) => {
   userhelpers.verifyPayment(req.body).then(()=>{
    
     userhelpers.changePaymentStatus(req.session.user.id,req.body['order[receipt]']).then(()=>{
 
       res.json({status:true})
 
     }).catch((err)=>{
  res.json({status:false ,err})
     })
 
   })
 
   
 },
 getOrderPage: (req, res) => {
  const getDate = (date) => {
    let orderDate = new Date(date);
    let day = orderDate.getDate();
    let month = orderDate.getMonth() + 1;
    let year = orderDate.getFullYear();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    return `${isNaN(day) ? "00" : day}-${isNaN(month) ? "00" : month}-${isNaN(year) ? "0000" : year
      } ${date.getHours(hours)}:${date.getMinutes(minutes)}:${date.getSeconds(seconds)}`;
  };
  userhelpers.orderPage(req.session.user.id).then((response) => {

    res.render('user/orderslist', { response, userSession,profileId, count, getDate })
  })

},
 
orderDetails: async (req, res) => {

  let orderId = req.query.order
   getDate = (date) => {
    let orderDate = new Date(date);
    let day = orderDate.getDate();
    let month = orderDate.getMonth() + 1;
    let year = orderDate.getFullYear();
   
    return `${isNaN(day) ? "00" : day}-${isNaN(month) ? "00" : month}-${isNaN(year) ? "0000" : year
      }`;
  };

  userhelpers.viewOrderDetails(orderId).then(async(response) => {
    let products = response.products[0]
    let address = response.address
    let orderDetails = response.details
    let data = userhelpers.createData(response,getDate)

    res.render('user/order-details', { products, address, orderDetails, userSession,profileId, count, getDate,data })

  })

  

},
 

 
 getAddresspage: async (req, res) => {
 
    
 
   let count = await userhelpers.getCartItemsCount(req.session.user.id);
 
 
   res.render('user/add-address',{userSession,profileId,count})
 
 },
 postAddresspage:  (req, res) => {
          
     
   userhelpers.postAddress(req.session.user.id,req.body).then(()=>{
 
   
     res.redirect('/check_out')
   })
 
 },
 getCancelOrder: (req, res) => {

  userhelpers.cancelOrder(req.query.orderid, req.session.user.id).then((response) => {
    res.json(response)
  })

},
 getReturnOrder: (req, res) => {

  userhelpers.returnOrder(req.query.orderid, req.session.user.id).then((response) => {
    res.json(response)
  })

},



  category: async(req, res) => {
    viewCategory = await adminHelper.viewAddCategory()

    userhelpers.category(req.query.cname).then((response)=>{
      
      res.render('user/filter-category',{ response, userSession,viewCategory,count})
    })
  },
 
  //************************************************************ */
  //**********COUPON STARTS HERE************** */
  //************************************************************ */

  applyCoupon: async (req, res) => {
    let code = req.query.code;
     total = await userhelpers.totalCheckOutAmount(req.session.user);
    couponHelpers.applyCoupon(code, total).then((response) => {
      req.session.user.total = response.total
      couponPrice = response.discountAmount ? response.discountAmount : 0;
      res.json(response);
    });
  },
  couponValidator: async (req, res) => {
    let code = req.query.code;
    couponHelpers
      .couponValidator(code, req.session.user.id)
      .then((response) => {
        res.json(response);
      });
  },
  couponVerify: async (req, res) => {
    let code = req.query.code;
    couponHelpers.couponVerify(code, req.session.user.id).then((response) => {

      res.json(response);
    });
  },

  //************************************************************ */
  //**********SEARCH PRODUCT STARTS HERE************** */
  //************************************************************ */
  searchProduct:async(req,res)=>{
    let payload=req.body.payload.trim();
    let search=await user.product.find({ Productname: { $regex:new RegExp('^' +payload+'.*','i')} }).exec();
    
    search=search.slice(0,10);
    res.send({payload:search})
  },

  getSuccessPage:(req,res)=>{
    res.render('user/success')
  }
};
