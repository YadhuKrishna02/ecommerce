const db = require("../models/connection");
const ObjectId = require("mongodb").ObjectId;
module.exports = {
    placeOrder: (orderData, total) => {
        return new Promise(async (resolve, reject) => {

            console.log(orderData);
            let productdetails = await db.cart.aggregate([
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

            let Address = await db.address.aggregate([
                { $match: { userid: ObjectId(orderData.user) } },

                { $unwind: "$Address" },

                { $match: { "Address._id": ObjectId(orderData.address) } },

                { $unwind: "$Address" },

                {
                    $project: {
                        item: "$Address",
                    },
                },
            ]);
            const items = Address.map((obj) => obj.item);

            let orderaddress = items;
            console.log(orderaddress, '----------------------------');

            let status = orderData['payment-method'] === 'COD' ? 'paid' : 'pending'

            let orderdata = {

                name: orderaddress.fname,
                paymentStatus: status,
                paymentmode: orderData['payment-method'],
                paymenmethod: orderData['payment-method'],
                productDetails: productdetails,
                shippingAddress: orderaddress,
                totalPrice: total
            }


            let order = await db.order.findOne({ userid: orderData.user })

            if (order) {
                await db.order.updateOne({ userid: orderData.user },
                    {
                        '$push':
                        {
                            'orders': orderdata
                        }
                    }).then((productdetails) => {

                        resolve(productdetails)
                    })
            } else {
                let newOrder = db.order({
                    userid: orderData.user,
                    orders: orderdata
                })

                await newOrder.save().then((orders) => {
                    resolve(orders)
                })
            }
            await db.cart.deleteMany({ user: orderData.user }).then(() => {
                resolve()
            })

        })
    },

    orderPage: (userId) => {
        return new Promise(async (resolve, reject) => {

            await db.order.aggregate([{
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

    cancelOrder: (orderId, userId) => {

        return new Promise(async (resolve, reject) => {

            let orders = await db.order.find({ 'orders._id': orderId })



            let orderIndex = orders[0].orders.findIndex(orders => orders._id == orderId);
            console.log(orderIndex + "order..................");

            await db.order.updateOne({ 'orders._id': orderId },
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

            let orders = await db.order.find({ 'orders._id': orderId })



            let orderIndex = orders[0].orders.findIndex(orders => orders._id == orderId)

            await db.order.updateOne({ 'orders._id': orderId },
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

    viewOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {

            let productid = await db.order.findOne({ "orders._id": orderId }, { 'orders.$': 1 });


            let details = productid.orders[0]
            let order = productid.orders[0].productDetails

            const productDetails = productid.orders.map(object => object.productDetails);
            const address = productid.orders.map(object => object.shippingAddress);
            const products = productDetails.map(object => object)

            resolve({ products, address, details, })



        })



    },
}