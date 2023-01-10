var express = require("express");
var router = express.Router();
const controllers = require("../controllers/usercontroller");
const middleware = require("../middlewares/middleware");
/* GET home page. */
router.get("/", controllers.getHome);

router.get("/login", middleware.userSession, controllers.getUserLogin);

router.post("/login", controllers.postUserLogin);

router.get("/otp_login", controllers.getUserOtpLogin);

router.post("/otp_login", controllers.postUserOtpLogin);

router.get("/otp_verify", controllers.getOtpVerify);

router.post("/otp_verify", controllers.postOtpVerify);

router.get("/signup", controllers.getSignUp);

router.post("/signup", controllers.postSignUp);

router.get("/shop", middleware.userSession, controllers.getShop);

router.get("/logout", middleware.userSession, controllers.getLogout);

router.get("/shop", middleware.userSession, controllers.getShop);

router.get(
  "/product_details/:id",
  middleware.userSession,
  controllers.getProductDetails
);

router.get(
  "/add_to_cart/:id",
  middleware.userSession,
  controllers.getAddToCart
);

router.get("/view_cart", middleware.userSession, controllers.getViewCart);

router.put(
  "/change_product_quantity",
  middleware.userSession,
  controllers.postchangeProductQuantity
);

router.delete(
  "/delete_cart_item",
  middleware.userSession,
  controllers.getDeleteCart
);

// router.get("/checkout", middleware.userSession, controllers.checkOut);

//************************************************************ */
//**********COUPON STARTS HERE************** */
//************************************************************ */

router.get("/apply_coupon", middleware.userSession, controllers.applyCoupon);

router.get(
  "/coupon_validator/:code",
  middleware.userSession,
  controllers.couponValidator
);

router.get("/coupon_verify", middleware.userSession, controllers.couponVerify);

module.exports = router;
