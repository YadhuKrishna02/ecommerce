const db = require("../models/connection");
const ObjectId = require("mongodb").ObjectId;
const Razorpay = require('razorpay');
const razorpay = require('../otp/razorpay');
const instance = new Razorpay({
    key_id: 'rzp_test_PhFuqLgHsH5Ajz',
    key_secret: 'UXvzfAkrkdiOg59z8kkBDaUJ',
});

module.exports = {
    generateRazorpay: (userId, total) => {

        return new Promise(async (resolve, reject) => {

            let orders = await db.order.find({ userid: userId })
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

    changePaymentStatus: (userId, orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orders = await db.order.find({ userId: userId })

                let orderIndex = orders[0].orders.findIndex(order => order._id == orderId)
                await db.order.updateOne(
                    {
                        'orders._id': ObjectId(orderId)
                    },
                    {
                        $set: {
                            ['orders.' + orderIndex + '.paymentStatus']: 'PAID'
                        }
                    }
                ),
                    await db.cart.deleteMany({ userid: orderId })
                        .then(() => {

                            resolve()

                        })
            } catch (err) {
            }

        })
    },

    verifyPayment: (details) => {
        console.log('hiii');
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
}