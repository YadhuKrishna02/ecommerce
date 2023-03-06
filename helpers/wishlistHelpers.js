const db = require("../models/connection");
const ObjectId = require("mongodb").ObjectId;
module.exports = {
    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let wishlist = await db.wishlist.findOne({ user: userId })
            if (wishlist) {
                count = wishlist.wishlistItems.length
            }

            resolve(count)

        })
    },

    addToWishlist: async (proId, userId) => {

        const proObj = {
            productId: proId
        };

        return new Promise(async (resolve, reject) => {
            let wishlist = await db.wishlist.findOne({ user: userId });
            if (wishlist) {
                let productExist = wishlist.wishlistItems.findIndex(
                    (item) => item.productId == proId
                );
                if (productExist == -1) {
                    db.wishlist
                        .updateOne(
                            { user: userId },
                            {
                                $addToSet: {
                                    wishlistItems: proObj
                                },
                            }
                        )
                        .then(() => {
                            resolve();
                        });
                }

            } else {
                const newWishlist = new db.wishlist({
                    user: userId,
                    wishlistItems: proObj
                });

                await newWishlist.save().then((data) => {
                    resolve(data);
                });
            }
        });
    },

    viewWishlist: (userId) => {
        return new Promise(async (resolve, reject) => {
            const id = await db.wishlist
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

    getDeleteWishList: (body) => {

        return new Promise(async (resolve, reject) => {

            await db.wishlist.updateOne({ _id: body.wishlistId },
                {
                    "$pull":

                        { wishlistItems: { productId: body.productId } }
                }).then(() => {
                    resolve({ removeProduct: true })
                })


        })
    },

}