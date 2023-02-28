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
  blockUser: (userID) => {
    console.log(userID);
    return new Promise(async (resolve, reject) => {
      await user.user
        .updateOne({ _id: userID }, { $set: { blocked: true } })
        .then((data) => {
          console.log("Data updated");
          resolve();
        });
    });
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
  ViewProduct: () => {
    return new Promise(async (resolve, reject) => {
      await user.product
        .find()
        .exec()
        .then((response) => {
          console.log(response);
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
  postEditProduct: (productId, editedData, filename) => {
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
              Image: filename,
            },
          }
        )
        .then((response) => {
          resolve(response);
        });
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
  getAllOrders:()=>
  {
    return new Promise(async (resolve, reject) => {
      let order = await user.order.aggregate([
        {$unwind: '$orders'},

      ]).then((response) => {
        console.log(response);
        resolve(response)
      })
     
    })
  },

  getOrderByDate:()=>
  {
     return new Promise(async (resolve, reject) => {
      const startDate = new Date('2022-01-01');
      await user.order.find({createdAt:{ $gte: startDate}}).then((response)=>
      {
        resolve(response)

      })
    });
  },


  getAllProducts:()=>
  {
    return new Promise(async(resolve, reject) => {
      await user.product.find().then((response)=>
      {
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
};
