const { application } = require("express");
const express = require("express");
const router = express.Router();
const controllers = require("../controllers/usercontroller");
const middleware = require("../middlewares/middleware");
const { route } = require("./admin");

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
/* GET home page. */
router.get("/", asyncHandler(controllers.getHome));

router.get("/login", middleware.userSession, controllers.getUserLogin);

router.post("/login", controllers.postUserLogin);

router.get('/update_password', controllers.getUpdatePassword)

router.post('/update_password', controllers.postUpdatePassword)

router.get("/reset_password", middleware.userSession, controllers.getPasswordReset)

router.post("/reset_password/:id", middleware.userSession, controllers.postPasswordReset)

router.get("/enter_new_pwd", middleware.userSession, controllers.getEnterNewPwd)

router.post("/enter_new_pwd/:id", middleware.userSession, controllers.updatePassword)

router.get("/profile/:id", middleware.userSession, controllers.getProfile);

router.put("/profile/:id", controllers.changeProfile);



router.get("/otp_login", controllers.getUserOtpLogin);

router.post("/otp_login", controllers.postUserOtpLogin);

router.get("/otp_verify", controllers.getOtpVerify);

router.post("/otp_verify", controllers.postOtpVerify);

router.get("/signup", controllers.getSignUp);

router.post("/signup", controllers.postSignUp);

router.get("/shop", middleware.userSession, controllers.getShop);

router.get("/logout", middleware.userSession, controllers.getLogout);

//Wishlist starts here

router.get("/add_to_wishlist", middleware.userSession, controllers.getWishlist);

router.get('/view_wishlist', middleware.userSession, controllers.listWishList);

router.delete('/delete_wishlist', middleware.userSession, controllers.deleteWishList)

router.get('/product_details/:id', middleware.userSession, controllers.getProductDetails)

router.get('/add_to_cart/:id', middleware.userSession, controllers.getAddToCart)

router.get("/view_cart", middleware.userSession, controllers.getViewCart);

router.post('/view_cart', middleware.userSession, controllers.postCart)

router.put("/change_product_quantity", middleware.userSession, controllers.postchangeProductQuantity);

router.delete("/delete_cart_item", middleware.userSession, controllers.getDeleteCart);

router.get("/check_out", middleware.userSession, controllers.checkOutPage);

router.post("/check_out", middleware.userSession, controllers.postcheckOutPage)

router.post("/create_order", controllers.paypalOrder)

router.get('/paypal_success', middleware.userSession, controllers.paypalSuccess)

router.post('/verify_payment', middleware.userSession, controllers.postVerifyPayment)

router.get('/order', middleware.userSession, controllers.getOrderPage)

router.put('/cancel_order', middleware.userSession, controllers.getCancelOrder)

router.put('/return_order', middleware.userSession, controllers.getReturnOrder)

router.get('/order_details', middleware.userSession, controllers.orderDetails)

router.get("/new_address", middleware.userSession, controllers.getAddresspage)

router.post("/new_address", middleware.userSession, controllers.postNewAddresspage)

router.get("/add_address", middleware.userSession, controllers.getAddresspage)

router.post('/add_address', middleware.userSession, controllers.postAddresspage)

router.get('/view_address', middleware.userSession, controllers.getViewAddress)

router.delete('/delete_address', controllers.deleteAddress)

router.get('/order_success', middleware.userSession, controllers.getSuccessPage)

//************************************************************ */
//**********COUPON STARTS HERE************** */
//************************************************************ */

router.post('/validate_coupon', middleware.userSession, controllers.validateCoupon)



//************************************************************ */
//**********SEARCH PRODUCT***************/
//************************************************************ */

router.post('/search', middleware.userSession, controllers.getSearch)

router.post('/sort', middleware.userSession, controllers.postSort)

router.get('/category', middleware.userSession, controllers.category)

module.exports = router;
