const db = require("../models/connection");
const voucher_codes = require("voucher-code-generator");
const objectId = require("mongodb").ObjectId;
let couponObj;
module.exports = {
  generateCoupon: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let couponCode = voucher_codes.generate({
          length: 6,
          count: 1,
          charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
          prefix: "WHITE-",
        });
        resolve({ status: true, couponCode: couponCode[0] });
      } catch (err) {
        console.log(err);
      }
    });
  },
  addNewCoupon: () => {
    return new Promise((resolve, reject) => {
      try {
        db.coupon(data)
          .save()
          .then(() => {
            resolve({ status: true });
          });
      } catch (error) {
        console.log(error);
      }
    });
  },
  getCoupons: () => {
    return new Promise((resolve, reject) => {
      try {
        db.coupon.find({}).then((data) => {
          resolve(data);
        });
      } catch (error) {}
    });
  },
  applyCoupon: (code, total) => {
    return new Promise(async (resolve, reject) => {
      try {
        let coupon = await db.coupon.findOne({ couponName: code });
        if (coupon) {
          //checking coupon Valid

          if (new Date(coupon.expiry) - new Date() > 0) {
            //checkingExpiry
            if (total >= coupon.minPurchase) {
              //checking max offer value
              let discountAmount = (total * coupon.discountPercentage) / 100;
              if (discountAmount > coupon.maxDiscountValue) {
                console.log("amal");
                discountAmount = coupon.maxDiscountValue;
                resolve({ status: true, discountAmount: discountAmount });
              } else {
                resolve({ status: true, discountAmount: discountAmount });
              }
            } else {
              console.log("ded1");
              resolve({
                status: false,
                reason: `Minimum purchase value is ${coupon.minPurchase}`,
              });
            }
          } else {
            console.log("ded2");
            resolve({ status: false, reason: "coupon Expired" });
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  },
  couponVerify: (code, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let usedCoupon = await db.user.aggregate([
          {
            $match: { _id: objectId(userId) },
          },
          {
            $unwind: "$coupons",
          },
          {
            $match: { _id: objectId(userId) },
          },
          {
            $match: {
              $and: [{ "coupons.couponName": code }, { "coupons.user": false }],
            },
          },
        ]);
        console.log(usedCoupon.length);
        if (usedCoupon.length == 1) {
          resolve({ status: true });
          console.log("hii");
        }
        //  else {
        //   console.log("hello");
        //   resolve({ status: false, reason: "coupon is already Used" });
        // }
      } catch (err) {
        console.log(err);
      }
    });
  },

  couponValidator: async (code, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let couponExists = await db.coupon.findOne({ couponName: code });

        if (couponExists) {
          if (new Date(couponExists.expiry) - new Date() > 0) {
            let userCouponExists = await db.user.findOne({
              _id: userId,
              "coupons.couponName": code,
            });
            if (!userCouponExists) {
              couponObj = {
                couponName: code,
                user: false,
              };
              db.user
                .updateOne(
                  { _id: userId },
                  {
                    $push: {
                      coupons: couponObj,
                    },
                  }
                )
                .then(() => {
                  resolve({ status: true });
                });
            } else {
              resolve({ status: false, reason: "coupon already used" });
            }
          } else {
            resolve({ status: false, reason: "coupon expired" });
          }
        } else {
          resolve({ status: false, reason: "coupon does'nt exist" });
        }
      } catch (error) {
        console.log(error);
      }
    });
  },
  deleteCoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      await db.coupon.deleteOne({ _id: couponId }).then((response) => {
        resolve(response);
      });
    });
  },
};
