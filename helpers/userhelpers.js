const user = require("../models/connection");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const ObjectId = require("mongodb").ObjectId;

const otp = require("../otp/otp");

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
          var hashedPassword = await bcrypt.hash(userData.password, 10);
          const data = new user.user({
            username: userData.username,
            Password: hashedPassword,
            email: userData.email,
            phonenumber: userData.phonenumber,
          });
          console.log(data);
          await data.save(data).then((data) => {
            resolve({ data, emailStatus: false });
          });
        }
      } catch (err) {
        console.log(err);
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
        console.log(err);
      }
    });
  },

  shopListProduct: () => {
    console.log("hi");
    return new Promise(async (resolve, reject) => {
      await user.product
        .find()
        .exec()
        .then((response) => {
          // console.log(response)
          resolve(response);
        });
    });
  },
  productDetails: (proId) => {
    return new Promise(async (resolve, reject) => {
      await user.product.find({ _id: proId }).then((response) => {
        // console.log(response);
        resolve(response);
      });
    });
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
        // console.log(cartItems);
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
        console.log(cartItems + "proid");
        await cartItems.save().then((data) => {
          console.log(data);

          resolve(data);
        });
      }
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
          console.log(cartItems);

          resolve(cartItems);
        });
    });
  },
  getCartItemsCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await user.cart.findOne({ user: userId });
      console.log(cart);
      if (cart) {
        count = cart.cartItems.length;
      }
      resolve(count);
      console.log(count);
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
};
