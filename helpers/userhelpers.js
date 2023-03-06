const db = require("../models/connection");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const ObjectId = require("mongodb").ObjectId;
const { Convert } = require("easy-currencies");

const otp = require("../otp/otp");

const { wishlist } = require("../models/connection");
const { resolve } = require("path");
const { editeduploads } = require("../multer/multer");

const client = require("twilio")(otp.accountId, otp.authToken);

let number;
module.exports = {
  doSignUp: (userData) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      try {
        email = userData.email;
        existingUser = await db.user.findOne({ email });
        if (existingUser) {
          response = { emailStatus: true };
          resolve(response);
        } else {
          let hashedPassword = await bcrypt.hash(userData.password, 10);
          const data = new db.user({
            username: userData.username,
            Password: hashedPassword,
            email: userData.email,
            phonenumber: userData.phonenumber,
          });
          await data.save(data).then((data) => {
            resolve({ data, emailStatus: false });
          });
        }
      } catch (err) {
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let users = await db.user.findOne({ email: userData.email });
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
      }
    });
  },

  verifyEmail: (userData) => {

    return new Promise(async (resolve, reject) => {
      let email = await db.user.findOne({ email: userData.email })
      console.log(email);
      if (email) {
        resolve({ status: true })
      }
      else {
        resolve({ status: false })
      }
    })


  },
  verifyPassword: (userData, userId) => {

    return new Promise(async (resolve, reject) => {
      let users = await db.user.findOne({ _id: userId })
      console.log(users);
      await bcrypt
        .compare(userData.password, users.Password)
        .then(async (status) => {
          if (status) {
            let hashedPassword = await bcrypt.hash(userData.password2, 10);
            await db.user.updateOne(
              { _id: userId },
              {
                $set: {
                  Password: hashedPassword
                }
              }
            ).then((response) => {
              console.log(response);
              resolve(response)
            }).catch((err) => {
              console.log(err);
            })

          }
          else {
            resolve(false)
          }
        });
    })


  },

  doUpdatePassword: (body) => {
    console.log(body);
    return new Promise(async (resolve, reject) => {
      let users = await db.user.findOne({ email: body.email });

      if (users) {
        let hashedPassword = await bcrypt.hash(body.password, 10);

        let change = await db.user
          .updateOne(
            { email: body.email },
            { $set: { Password: hashedPassword } }
          )
          .then((result) => {
            console.log(result);
            resolve({ update: true });
          });
      } else {
        resolve({ update: false });
      }
    });
  },


  documentCount: () => {
    return new Promise(async (resolve, reject) => {
      await db.product.find().countDocuments().then((documents) => {

        resolve(documents);
      })
    })
  },


  findUser: (userId) => {
    return new Promise(async (resolve, reject) => {
      await db.user.findById({ _id: userId }).then((user) => {

        resolve(user)
      })

    })
  },



  changeProfile: async (userId, data) => {
    let number = data.phone;

    console.log(data, userId);
    await new Promise(async (resolve, reject) => {

      await db.user.updateOne({ _id: userId },
        {
          $set: {
            username: data.fname,
            email: data.email,
            phonenumber: Number(number),
          }
        }).then((data) => {
          console.log(data);
          resolve(data)
        });
    });

  },
  category: (categoryName) => {
    return new Promise(async (resolve, reject) => {
      await db.product.find({ category: categoryName }).then((response) => {
        resolve(response)
      })
    })

  },

  createData: (details, dates) => {
    let address = details.address[0][0]
    console.log(address);
    let product = details.products[0][0]
    let orderDetails = details.details.createdAt

    console.log('orderdetails', orderDetails);
    let myDate = dates(orderDetails);

    let data = {
      // Customize enables you to provide your own templates
      // Please review the documentation for instructions and examples
      customize: {
        //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
      },
      images: {
        // The logo on top of your invoice
        logo: "https://cdn.freelogodesign.org/files/ff0105e7b374444a99ea2be533fd7d6d/thumb/logo_200x200.png?v=0",
        // The invoice background

      },
      // Your own data
      sender: {
        company: "WHITE SPARROW",
        address: "Bournivilla tower",
        zip: "4567 CD",
        city: "Los santos",
        country: "America",

      },
      // Your recipient
      client: {

        company: address.fname,
        address: address.street,
        zip: address.pincode,
        city: address.city,
        country: "India",
      },

      information: {
        number: address.mobile,
        date: myDate,
        "due-date": myDate

      },

      products: [
        {
          quantity: product.quantity,
          description: product.productsName,
          "tax-rate": 0,
          price: product.productsPrice,
        },
      ],
      // The message you would like to display on the bottom of your invoice
      "bottom-notice": "Thank you for your order from WHITE SPARROW",
      // Settings to customize your invoice
      settings: {
        currency: "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
      },

    };

    return data;
  },

  searchProduct: (product) => {
    return new Promise(async (resolve, reject) => {



      resolve(search)

    })
  },

  productSearch: (searchData) => {
    let keyword = searchData.search
    console.log(keyword);
    return new Promise(async (resolve, reject) => {
      try {
        const products = await db.product.find({ Productname: { $regex: new RegExp(keyword, 'i') } });

        if (products.length > 0) {
          console.log(products);
          resolve(products);
        } else {
          reject('No products found.');
        }
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  },

  postSort: (sortOption) => {
    return new Promise(async (resolve, reject) => {
      let products;
      if (sortOption === 'price-low-to-high') {

        products = await db.product.find().sort({ Price: 1 }).exec();
      } else if (sortOption === 'price-high-to-low') {

        products = await db.product.find().sort({ Price: -1 }).exec();
      } else {
        products = await db.product.find().exec();
      }
      resolve(products)
    })

  },

};
