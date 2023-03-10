const { response } = require("express");
const user = require("../models/connection");
let prodActive;
module.exports = {
  getUsers: () => {
    console.log(user);
    return new Promise(async (resolve, reject) => {
      let userDatas = [];
      await user.user
        .find()
        .exec()
        .then((result) => {
          userDatas = result;
        });
      console.log(userDatas);
      resolve(userDatas);
    });
  },
  UnblockUser: (userID) => {
    console.log(userID);
    return new Promise(async (resolve, reject) => {
      await user.user
        .updateOne({ _id: userID }, { $set: { blocked: false } })
        .then((data) => {
          console.log("Data updated");
          resolve();
        });
    });
  },

  blockUser: async (userID) => {
    try {
      return await user.user
        .updateOne({ _id: userID }, { $set: { blocked: true } })
    }
    catch (err) {
      return err
    }
  },
  addCategory: (data) => {
    let response = {};

    return new Promise(async (resolve, reject) => {
      let category = data.categoryname;
      existingCategory = await user.categories.findOne({
        categoryName: category,
      });
      if (existingCategory) {
        console.log("category exists");
        response = { categoryStatus: true };
        resolve(response);
      } else {
        console.log("category not exist");
        const categoryData = new user.categories({
          categoryName: data.categoryname,
        });
        console.log(categoryData);
        await categoryData.save().then((data) => {
          console.log(data);
          resolve(data);
        });
      }
    });
  },
  viewAddCategory: () => {
    return new Promise(async (resolve, reject) => {
      await user.categories
        .find()
        .exec()
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      await user.categories.deleteOne({ _id: categoryId }).then((response) => {
        resolve(response);
      });
    });
  },
  editCategory: (categoryId, editedName) => {
    return new Promise(async (resolve, reject) => {
      await user.categories
        .updateOne(
          { _id: categoryId },
          {
            $set: {
              categoryName: editedName,
            },
          }
        )
        .then(() => {
          console.log("Data updated");
          resolve();
        });
    });
  },
  findCategory: (categoryId) => {
    return new Promise(async (resolve, reject) => {
      await user.categories
        .find({ _id: categoryId })
        .exec()
        .then((data) => {
          resolve(data[0]);
        });
    });
  },
  findAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      await user.categories
        .find()
        .exec()
        .then((data) => {
          console.log(data);

          resolve(data);
        });
    });
  },
  AddProduct: (userdata, filename) => {
    return new Promise((resolve, reject) => {
      // console.log(req.body);
      // console.log(req.file.filename);

      ImageUpload = new user.product({
        Productname: userdata.name,
        ProductDescription: userdata.description,
        Quantity: userdata.quantity,
        Image: filename,
        category: userdata.category,
        Price: userdata.price,
      });
      ImageUpload.save().then((data) => {
        //   console.log(data);
        resolve(data);
      });
    });
  },
  ViewProduct: (pageNum, perPage) => {
    return new Promise(async (resolve, reject) => {
      await user.product
        .find()
        .skip((pageNum - 1) * perPage).limit(perPage)
        .then((response) => {
          resolve(response);
        });

    });
  },
  // deleteViewProduct: (productId) => {
  //   return new Promise(async (resolve, reject) => {
  //     await user.product.deleteOne({ _id: productId }).then((response) => {
  //       resolve(response);
  //     });
  //   });
  // },
  editProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      await user.product
        .findOne({ _id: productId })
        .exec()
        .then((response) => {
          resolve(response);
          console.log(response);
        });
    });
  },


  postEditProduct: (productId, editedData, images) => {
    return new Promise(async (resolve, reject) => {
      await user.product
        .updateOne(
          { _id: productId },
          {
            $set: {
              Productname: editedData.name,
              ProductDescription: editedData.description,
              Quantity: editedData.quantity,
              Price: editedData.price,
              category: editedData.category,
              Image: images,
            },
          }
        )
        .then((response) => {
          resolve(response);
        }).catch((err) => {
          reject(err)
        })
    });
  },
  unlistProduct: (prodId) => {
    return new Promise(async (resolve, reject) => {
      let checkProd = await user.product
        .updateOne({ _id: prodId }, { $set: { productActive: false } })
        .then(() => {
          // prodActive = data[0];
          resolve();
        });
    });
  },
  listProduct: (prodId) => {
    return new Promise(async (resolve, reject) => {
      let checkProd = await user.product
        .updateOne({ _id: prodId }, { $set: { productActive: true } })
        .then(() => {
          // console.log(data + "i am in list");
          // prodActive = data[0];
          resolve();
        });
    });
  },
  orderPage: () => {
    return new Promise(async (resolve, reject) => {

      await user.order.aggregate([
        {
          $unwind: '$orders'
        },
        {
          $sort: { 'orders: createdAt': -1 }
        }
      ]).then((response) => {
        console.log(response);
        resolve(response)

      })
    })

  },
  orderDetails: (orderId) => {
    return new Promise(async (resolve, reject) => {

      let order = await user.order.findOne({ 'orders._id': orderId }, { 'orders.$': 1 })
      console.log(order + '----------------------------------------------------------------');
      resolve(order)
    })

  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let order = await user.order.aggregate([

        { $unwind: '$orders' },
        {
          $match: {
            $or: [
              { "orders.orderStatus": "Success" },
              { "orders.orderStatus": "Delivered" }
            ]
          }
        }


      ]).then((response) => {
        resolve(response)
      })

    })
  },

  getOrderByDate: async () => {

    try {
      const startDate = new Date('2022-01-01');
      let orderDate = await user.order.find({ createdAt: { $gte: startDate } });
      console.log(orderDate);
      return orderDate
    }
    catch (err) {
      console.log(err);
    }
  },


  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      await user.product.find().then((response) => {
        resolve(response)
      })
    })
  },
  changeOrderStatus: (orderId, data) => {
    return new Promise(async (resolve, reject) => {
      let orders = await user.order.findOne({ 'orders._id': orderId }, { 'orders.$': 1 })

      let users = await user.order.updateOne(
        { 'orders._id': orderId },
        {
          $set: {
            'orders.$.orderStatus': data.status,

          }
        }
      )
      resolve(response)
    })

  },

  // add banner

  addBanner: (texts, Image) => {

    return new Promise(async (resolve, reject) => {

      let banner = user.banner({
        title: texts.title,
        description: texts.description,
        link: texts.link,
        image: Image

      })
      await banner.save().then((response) => {
        resolve(response)
      })
    })
  },

  /// list banner
  listBanner: () => {

    return new Promise(async (resolve, reject) => {
      await user.banner.find().exec().then((response) => {
        resolve(response)
      })
    })
  },

  // edit banner

  editBanner: (bannerId) => {

    return new Promise(async (resolve, reject) => {

      let bannerid = await user.banner.findOne({ _id: bannerId }).then((response) => {
        resolve(response)
      })

    })

  },

  //post edit banner

  postEditBanner: (bannerid, texts, Image) => {

    return new Promise(async (resolve, reject) => {

      let response = await user.banner.updateOne({ _id: bannerid },
        {
          $set: {

            title: texts.title,
            description: texts.description,
            // created_at: updated_at,
            link: texts.link,
            image: Image
          }

        })
      resolve(response)
    })

  },
  getCodCount: () => {
    return new Promise(async (resolve, reject) => {
      let response = await user.order.aggregate([
        {
          $unwind: "$orders"
        },
        {
          $match: {
            "orders.paymentmode": "COD"
          }
        },
      ])
      resolve(response)
    })
  },


  getOnlineCount: () => {
    return new Promise(async (resolve, reject) => {
      let response = await user.order.aggregate([
        {
          $unwind: "$orders"
        },
        {
          $match: {
            "orders.paymentmode": "online"
          }
        },
      ])
      resolve(response)
    })
  },
  getPaypalCount: () => {
    return new Promise(async (resolve, reject) => {
      let response = await user.order.aggregate([
        {
          $unwind: "$orders"
        },
        {
          $match: {
            "orders.paymentmode": "paypal"
          }
        },
      ])
      resolve(response)
    })
  },

  totalUserCount: () => {

    return new Promise(async (resolve, reject) => {
      let response = await user.user.find().exec()

      resolve(response)

    })
  },

  getSalesReport: () => {
    return new Promise(async (resolve, reject) => {
      let response = await user.order.aggregate([
        {
          $unwind: "$orders"
        },
        {
          $match: {
            "orders.orderStatus": "Delivered"
          }
        },
      ])
      resolve(response)
    })
  },

  gettotalamount: () => {
    return new Promise(async (resolve, reject) => {


      await user.order.aggregate([

        {
          $unwind: '$orders'
        },
        {
          $match: {
            "orders.orderStatus": "Delivered"
          }
        },
        {
          $project: {
            productDetails: '$orders.productDetails',

          }

        },
        {
          $unwind: '$productDetails'
        },

        {
          $project: {
            price: '$productDetails.productsPrice',
            quantity: '$productDetails.quantity'
          }
        },


        // {
        //   $lookup: {
        //     from: 'products',
        //     localField: "item",
        //     foreignField: "_id",
        //     as: 'carted'
        //   }
        // },
        // {
        //   $project: {
        //     item: 1, quantity: 1, product: { $arrayElemAt: ['$carted', 0] }
        //   }

        // },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$price", "$quantity"] } }
          }
        }
      ]).then((total) => {


        resolve(total[0]?.total)


      })

    })

  },
  getTotalAmount: (date) => {
    let start = new Date(date.startdate);
    let end = new Date(date.enddate);
    return new Promise(async (resolve, reject) => {


      await user.order.aggregate([

        {
          $unwind: '$orders'
        },
        {
          $match: {
            $and: [
              { "orders.orderStatus": "Delivered" },
              { "orders.createdAt": { $gte: start, $lte: end } }

            ]
          }
        },
        {
          $project: {
            productDetails: '$orders.productDetails',

          }

        },
        {
          $unwind: '$productDetails'
        },

        {
          $project: {
            price: '$productDetails.productsPrice',
            quantity: '$productDetails.quantity'
          }
        },


        // {
        //   $lookup: {
        //     from: 'products',
        //     localField: "item",
        //     foreignField: "_id",
        //     as: 'carted'
        //   }
        // },
        // {
        //   $project: {
        //     item: 1, quantity: 1, product: { $arrayElemAt: ['$carted', 0] }
        //   }

        // },
        {
          $group: {
            _id: 0,
            total: { $sum: { $multiply: ["$price", "$quantity"] } }
          }
        }
      ]).then((total) => {


        resolve(total[0]?.total)
        // console.log(total[0].total[0], '------------------------------');


      })

    })

  },
  postReport: (date) => {
    let start = new Date(date.startdate);
    let end = new Date(date.enddate);

    return new Promise(async (resolve, reject) => {
      await user.order.aggregate([
        {
          $unwind: "$orders",
        },
        {
          $match: {
            $and: [
              { "orders.orderStatus": "Delivered" },
              { "orders.createdAt": { $gte: start, $lte: end } }

            ]
          }
        }
      ])
        .exec()
        .then((response) => {
          console.log(response);
          resolve(response)
        })
    })

  },
  //Sales
};
