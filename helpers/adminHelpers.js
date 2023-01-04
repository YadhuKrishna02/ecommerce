const { response } = require("express");
const user = require("../models/connection");

let existingCategory;
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
        response = { categoryStatus: true };
        resolve(response);
      } else {
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
  deleteViewProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      await user.product.deleteOne({ _id: productId }).then((response) => {
        resolve(response);
      });
    });
  },
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
      console.log(editedData);
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
};
