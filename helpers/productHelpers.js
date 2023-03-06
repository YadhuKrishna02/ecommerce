const db = require("../models/connection");
const ObjectId = require("mongodb").ObjectId;

module.exports = {
    shopListProduct: (pageNum) => {

        let perPage = 6
        return new Promise(async (resolve, reject) => {



            await db.product.find().skip((pageNum - 1) * perPage).limit(perPage).then((response) => {

                resolve(response)
            })


        })
    },

    productDetails: (proId) => {
        return new Promise(async (resolve, reject) => {
            await db.product.find({ _id: proId }).then((response) => {
                resolve(response);
            });
        });
    },
}