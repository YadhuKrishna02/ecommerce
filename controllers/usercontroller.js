const userhelpers = require("../helpers/userhelpers");
const user = require("../models/connection");
const otp = require("../otp/otp");
const ObjectId = require("mongodb").ObjectId;
const adminHelper = require("../helpers/adminHelpers");

const client = require("twilio")(otp.accountId, otp.authToken);

let userSession, number, loggedUser, loggedUserId;
let count, otpNumber;

module.exports = {
  getHome: async (req, res) => {
    userSession = req.session.userLoggedIn;
    if (req.session.userLoggedIn) {
      count = await userhelpers.getCartItemsCount(req.session.user.id);
      res.render("user/user", { userSession, count });
    } else {
      res.render("user/user", { userSession });
    }
  },
  getUserLogin: async (req, res) => {
    count = await userhelpers.getCartItemsCount(req.session.user.id);

    userSession = req.session.userLoggedIn;

    res.render("user/user", { userSession, count });
  },
  getUserOtpLogin: (req, res) => {
    res.render("user/otplogin", { userSession });
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

  postOtpVerify: (req, res) => {
    otpNumber = req.body.otp;

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
          res.render("user/user", { userSession });
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
      var emailStatus = response.emailStatus;
      if (emailStatus == false) {
        res.redirect("/login");
      } else {
        res.render("user/signup", { emailStatus });
      }
    });
  },
  getShop: async (req, res) => {
    count = await userhelpers.getCartItemsCount(req.session.user.id);
    viewCategory = await adminHelper.viewAddCategory();

    userhelpers.shopListProduct().then((response) => {
      // console.log(response);
      res.render("user/shop", { response, userSession, count, viewCategory });
    });
  },

  getProductDetails: async (req, res) => {
    count = await userhelpers.getCartItemsCount(req.session.user.id);

    userhelpers.productDetails(req.params.id).then((data) => {
      console.log(data);
      res.render("user/eachproduct", { userSession, data, count });
    });
  },

  getAddToCart: (req, res) => {
    userhelpers.addToCart(req.params.id, req.session.user.id).then((data) => {
      console.log(data);
      res.json({ status: true });
    });
  },

  getViewCart: async (req, res) => {
    console.log(req);
    let userId = req.session.user;
    let total = await userhelpers.totalCheckOutAmount(req.session.user.id);
    let count = await userhelpers.getCartItemsCount(req.session.user.id);

    let cartItems = await userhelpers.viewCart(req.session.user.id);
    // console.log(cartItems);

    res.render("user/view-cart", {
      cartItems,
      userId,
      userSession,
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
    console.log(req.body);
    userhelpers.deleteCart(req.body).then((response) => {
      res.json(response);
    });
  },
  getProceedToCheckOut: (req, res) => {},

  getLogout: (req, res) => {
    req.session.user = null;
    req.session.userLoggedIn = false;

    res.redirect("/login");
  },
};
