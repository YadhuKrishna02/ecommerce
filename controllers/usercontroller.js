require('dotenv').config()
const userhelpers = require("../helpers/userhelpers");
const couponHelpers = require("../helpers/couponHelpers");
const adminHelper = require("../helpers/adminHelpers");
const cartHelper = require("../helpers/cartHelpers");
const productHelper = require("../helpers/productHelpers");
const wishlistHelper = require("../helpers/wishlistHelpers");
const checkoutHelper = require("../helpers/checkoutHelpers");
const orderHelper = require("../helpers/orderHelpers");
const paymentHelper = require("../helpers/paymentHelpers");
// const orderHelper = require("../helpers/orderHelpers");
const user = require("../models/connection");
const otp = require("../otp/otp");
const ObjectId = require("mongodb").ObjectId;
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

let userSession, number, loggedUser, profileId, userDetails, userAddDetails, getDate, finalTotal;
let count, wishcount,
  otpNumber, total
couponPrice = 0;

module.exports = {
  getHome: async (req, res) => {
    try {

      userSession = req.session.userLoggedIn;
      if (req.session.userLoggedIn) {
        profileId = req.session.user.id;
        count = await cartHelper.getCartItemsCount(req.session.user.id);
        res.render("user/user", { userSession, wishcount, profileId, count });
      } else {
        res.render("user/user", { userSession, wishcount, profileId });
      }
    }
    catch (err) {
      res.status(500)
    }

  },
  getUserLogin: async (req, res) => {
    try {
      count = await cartHelper.getCartItemsCount(req.session.user.id);

      userSession = req.session.userLoggedIn;

      res.render("user/user", { userSession, wishcount, count, profileId });
    } catch (error) {
      res.status(500)
    }

  },
  getUserOtpLogin: (req, res) => {
    res.render("user/otplogin", { userSession, profileId });
  },
  postUserOtpLogin: async (req, res) => {
    try {
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
    } catch (error) {

      res.status(500)
    }

  },

  postOtpVerify: async (req, res) => {
    try {

      otpNumber = req.body.otp;
      await client.verify.v2
        .services(otp.serviceId)
        .verificationChecks.create({ to: `+91 ${number}`, code: otpNumber })
        .then((verification_check) => {
          if (verification_check.valid == true) {
            let id = loggedUser[0]._id;
            req.session.user = { loggedUser, id };

            req.session.userLoggedIn = true;
            userSession = req.session.userLoggedIn;

            res.render("user/user", { userSession, countdown: 60 });
          } else {
            res.redirect("/otp_verify");
          }
        });
    } catch (error) {
      res.status(500)
    }

  },
  getOtpVerify: (req, res) => {
    res.render("user/otp-entering");
  },

  postUserLogin: async (req, res) => {
    try {
      await userhelpers.doLogin(req.body).then((response) => {
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
    } catch (error) {
      res.status(500)
    }

  },
  getSignUp: (req, res) => {
    res.render("user/signup");
  },
  postSignUp: async (req, res) => {
    try {
      await userhelpers.doSignUp(req.body).then((response) => {
        let emailStatus = response.emailStatus;
        if (emailStatus == false) {
          res.redirect("/login");
        } else {
          res.render("user/signup", { emailStatus });
        }
      });
    } catch (error) {

    }

  },

  getUpdatePassword: (req, res) => {
    res.render("user/update-password");
  },

  postUpdatePassword: (req, res) => {
    try {
      userhelpers.doUpdatePassword(req.body).then((response) => {
        if (response.update) {
          res.redirect("/login");
        } else {
          res.render("user/update-password", { updateStaus: true });
        }
      });
    } catch (error) {
      res.status(500)
    }

  },
  getPasswordReset: (req, res) => {
    res.render("user/reset-password", { userSession, profileId })
  },
  postPasswordReset: async (req, res) => {
    try {
      let response = await userhelpers.verifyEmail(req.body)
      res.json(response.status)
    } catch (error) {
      res.status(500)
    }

  },
  getEnterNewPwd: (req, res) => {
    res.render("user/enter-pwd", { userSession, profileId })

  },
  updatePassword: async (req, res) => {

    try {
      let passResponse = await userhelpers.verifyPassword(req.body, req.params.id);
      if (passResponse) {
        res.json(true)
      }
      else {
        res.json(false);

      }
    } catch (error) {
      res.status(500)
    }


  },

  getProfile: async (req, res) => {
    try {
      let data = await userhelpers.findUser(profileId);
      res.render("user/profile", { userSession, wishcount, count, profileId, data });
    } catch (error) {
      res.status(500)
    }

  },

  changeProfile: async (req, res) => {
    try {
      await userhelpers.changeProfile(profileId, req.body)
        .then((data) => {
          res.json({ data })
        });
    } catch (error) {
      res.status(500)
    }

  },


  getShop: async (req, res) => {
    try {
      let pageNum = req.query.page
      let currentPage = pageNum
      let perPage = 6
      // let currentUserId=req.session.user.id

      count = await cartHelper.getCartItemsCount(req.session.user.id)
      viewCategory = await adminHelper.viewAddCategory()
      documentCount = await userhelpers.documentCount()
      let pages = Math.ceil(parseInt(documentCount) / perPage)

      productHelper.shopListProduct(pageNum).then((response) => {

        res.render('user/shop', { response, profileId, wishcount, userSession, count, viewCategory, currentPage, documentCount, pages })
      })
    } catch (error) {
      res.status(500)
    }



  },
  getProductDetails: async (req, res) => {
    try {
      count = await cartHelper.getCartItemsCount(req.session.user.id);
      console.log(count);

      productHelper.productDetails(req.params.id).then((data) => {
        res.render("user/eachproduct", { userSession, profileId, data, count, wishcount });
      });
    } catch (error) {
      res.status(500)
    }

  },

  getAddToCart: async (req, res) => {

    try {
      await cartHelper.addToCart(req.params.id, req.session.user.id).then((data) => {
        res.json({ status: true });
      });
    } catch (error) {
      res.status(500)
    }
  },
  // getWishlist: async (req, res) => {
  //   try {
  //     wishcount = await wishlistHelper.getWishCount(profileId)
  //     wishlistHelper.addToWishlist(req.params.prodId, req.session.user.id).then((data) => {
  //       res.json({ status: true });
  //     });
  //   } catch (error) {
  //     res.status(500)
  //   }

  // },
  getWishlist: (req, res) => {


    wishlistHelper
      .addToWishList(req.query.wishid, req.session.user.id)
      .then((response) => {
        res.json(response.status);
      });
  },

  // viewWishlist: async (req, res) => {

  //   try {
  //     let wishlistItems = await wishlistHelper.viewWishlist(req.session.user.id);
  //     console.log(wishlistItems);
  //     console.log(wishlistItems[1].wishlistItems);
  //     res.render("user/wishlist", { userSession, profileId, count, wishlistItems, wishcount })
  //   } catch (error) {
  //     res.status(500)
  //   }

  // },
  listWishList: async (req, res) => {

    await wishlistHelper
      .ListWishList(req.session.user.id)
      .then((wishlistItems) => {
        console.log(wishlistItems);
        console.log('jjjjjjjjjjjjjjjjjjjj');

        res.render("user/wishlist", {
          wishlistItems,
          wishcount,
          count,
          userSession,
          profileId
        });
      });
  },
  deleteWishList: async (req, res) => {
    try {
      await wishlistHelper.getDeleteWishList(req.body).then((response) => {

        res.json(response)

      })
    } catch (error) {
      res.status(500)
    }

  },

  getViewCart: async (req, res) => {
    try {
      let userId = req.session.user;
      total = await cartHelper.totalCheckOutAmount(req.session.user.id);

      let count = await cartHelper.getCartItemsCount(req.session.user.id);

      let cartItems = await cartHelper.viewCart(req.session.user.id);
      console.log(cartItems);

      res.render("user/view-cart", {
        cartItems,
        userId,
        userSession,
        profileId,
        count, wishcount,
        total, finalTotal
      });
    } catch (error) {
      res.status(500)
    }

  },
  postchangeProductQuantity: async (req, res) => {
    try {
      await cartHelper.changeProductQuantity(req.body).then(async (response) => {
        response.total = await cartHelper.totalCheckOutAmount(req.body.user);

        res.json(response);
      });
    } catch (error) {
      res.status(500)
    }
  },

  getDeleteCart: async (req, res) => {
    try {
      await cartHelper.deleteCart(req.body).then((response) => {
        res.json(response);
      });
    } catch (error) {
      res.status(500)
    }
  },


  getLogout: (req, res) => {
    req.session.user = null;
    req.session.userLoggedIn = false;

    res.redirect("/login");
  },



  checkOutPage: async (req, res) => {

    try {
      let users = req.session.user.id
      if (req.session.user.finalTotal) {
        total = req.session.user.finalTotal
      }
      else {

        total = await cartHelper.totalCheckOutAmount(req.session.user.id)
      }

      let count = await cartHelper.getCartItemsCount(req.session.user.id);
      let cartItems = await cartHelper.viewCart(req.session.user.id)
      checkoutHelper.checkOutpage(req.session.user.id).then((response) => {


        res.render('user/checkout', { paypalClientId: process.env.PAYPAL_CLIENT_ID, users, userSession, profileId, cartItems, total, response, wishcount, count })
      })
    } catch (error) {
      res.status(500)
    }


  },

  postcheckOutPage: async (req, res) => {

    try {
      if (req.session.user.finalTotal) {
        total = req.session.user.finalTotal
      }
      else {

        total = await cartHelper.totalCheckOutAmount(req.session.user.id)
      }
      req.session.user.finalTotal = null

      let order = await orderHelper.placeOrder(req.body, total).then(async (response) => {




        if (req.body['payment-method'] == 'COD') {
          res.json({ codstatus: true })

        } else if (req.body['payment-method'] == 'online') {
          paymentHelper.generateRazorpay(req.session.user.id, total).then((order) => {
            res.json(order)

          })
        }
        else {
          let value = await Convert(total).from("INR").to("USD");
          console.log(value);
          let price = Math.round(value)
          res.json({ paypal: true, price: price })
        }
      })

    } catch (error) {
      res.status(500)
    }


  },

  paypalOrder: async (req, res) => {

    try {
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

      const order = await paypalClient.execute(request)
      res.json({ id: order.result.id })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  },
  paypalSuccess: async (req, res) => {

    try {
      const ordersDetails = await user.order.find({ userId: profileId })
      let orders = ordersDetails[0].orders.slice().reverse()
      let orderId1 = orders[0]._id
      let orderId = "" + orderId1

      paymentHelper.changePaymentStatus(req.session.user, orderId).then(() => {
        res.json({ status: true })
      })
    } catch (error) {
      res.status(500)
    }

  },

  postVerifyPayment: async (req, res) => {
    await paymentHelper.verifyPayment(req.body).then(() => {

      paymentHelper.changePaymentStatus(req.session.user.id, req.body['order[receipt]']).then(() => {

        res.json({ status: true })

      }).catch((err) => {
        res.json({ status: false, err })
      })

    })


  },
  getOrderPage: async (req, res) => {

    try {
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
      await orderHelper.orderPage(req.session.user.id).then((response) => {

        res.render('user/orderslist', { response, userSession, profileId, wishcount, count, getDate })
      })
    } catch (error) {
      res.status(500)
    }


  },

  orderDetails: async (req, res) => {

    try {
      let orderId = req.query.order
      getDate = (date) => {
        let orderDate = new Date(date);
        let day = orderDate.getDate();
        let month = orderDate.getMonth() + 1;
        let year = orderDate.getFullYear();

        return `${isNaN(day) ? "00" : day}-${isNaN(month) ? "00" : month}-${isNaN(year) ? "0000" : year
          }`;
      };

      await orderHelper.viewOrderDetails(orderId).then(async (response) => {
        let products = response.products[0]
        let address = response.address[0]
        console.log(address);
        let orderDetails = response.details
        let data = userhelpers.createData(response, getDate)

        res.render('user/order-details', { products, address, orderDetails, userSession, profileId, wishcount, count, getDate, data })

      })
    } catch (error) {
      res.status(500)
    }



  },



  getAddresspage: (req, res) => {
    try {
      res.render('user/add-address', { userSession, profileId, wishcount, count })

    } catch (error) {
      res.status(500)
    }

  },
  getViewAddress: async (req, res) => {
    try {
      let user = req.session.user.id;
      let users = req.session.user;
      await checkoutHelper.getAddress(req.session.user.id).then((response) => {
        console.log(response);
        res.render("user/view-address", { userSession, profileId, response, wishcount, count, user, users });
      });
    } catch (error) {
      res.status(500)
    }
  },

  deleteAddress: async (req, res) => {
    try {
      await checkoutHelper.deleteAddress(req.body).then((response) => {
        console.log(response);
        res.json(response);
      });
    } catch (error) {
      res.status(500)
    }
  },
  postAddresspage: async (req, res) => {

    try {
      await checkoutHelper.postAddress(req.session.user.id, req.body).then(() => {
        res.redirect('/check_out')
      })
    } catch (error) {
      res.status(500)
    }

  },
  postNewAddresspage: async (req, res) => {
    try {
      await checkoutHelper.postNewAddress(req.session.user.id, req.body).then(() => {

        res.redirect('/profile/' + profileId)
      })
    } catch (error) {
      res.status(500)
    }

  },
  getCancelOrder: async (req, res) => {

    try {
      await orderHelper.cancelOrder(req.query.orderid, req.session.user.id).then((response) => {
        res.json(response)
      })
    } catch (error) {
      res.status(500)
    }

  },
  getReturnOrder: async (req, res) => {

    try {
      await orderHelper.returnOrder(req.query.orderid, req.session.user.id).then((response) => {
        res.json(response)
      })

    } catch (error) {
      res.status(500)
    }
  },



  category: async (req, res) => {
    let userSession = req.session.user.id
    try {
      await userhelpers.category(req.query.cname).then(async (response) => {
        let category2 = await adminHelper.viewAddCategory()
        console.log(category2, 'dfffffffffffffffff');
        if (response) {

          res.render('user/shop-new2', { userSession, profileId, response, category2, wishcount, count })
        }

      })
    } catch (error) {
      res.status(500)
    }
  },

  //************************************************************ */
  //**********COUPON STARTS HERE************** */
  //************************************************************ */


  validateCoupon: async (req, res) => {

    console.log(req.query.couponName);
    let code = req.query.couponName;
    let total = await cartHelper.totalCheckOutAmount(profileId)
    couponHelpers.couponValidator(code, profileId, total).then((response) => {
      res.json(response)
    })

  },

  postCart: async (req, res) => {

    console.log('hiiiiiiiiiiiiiiii');
    let couponData = req.body
    console.log(req.body);
    couponName = req.body.couponName
    couponTotal = req.body.total
    discountAmount = req.body.discountAmount
    if (couponData.couponName) {
      await couponHelpers.addCouponIntUseroDb(couponData, req.session.user.id).then((response) => {
        res.redirect("/check_out")
      })
    } else {
      console.log('hloooooooooooooo');
      res.redirect('/check_out')
    }

  },

  //************************************************************ */
  //**********SEARCH PRODUCT STARTS HERE************** */
  //************************************************************ */

  getSuccessPage: (req, res) => {
    res.render('user/success')
  },

  getSearch: async (req, res) => {

    let viewCategory = await adminHelper.viewAddCategory()


    userhelpers.productSearch(req.body).then((response) => {
      if (response) {

        res.render('user/shop-new', { userSession, profileId, response, viewCategory, wishcount, count })
        console.log(response);
      }
    }).catch((err) => {
      console.log(err);
      res.render('user/shop-new', { err, userSession, profileId, viewCategory, wishcount, count })

    })
  },

  postSort: async (req, res) => {
    let sortOption = req.body['selectedValue'];
    let viewCategory = await adminHelper.viewAddCategory()
    userhelpers.postSort(sortOption).then((response) => {
      if (response) {

        res.render('user/shop-new', { response, userSession, profileId, viewCategory, count, wishcount })
      }
    })
  },
};
