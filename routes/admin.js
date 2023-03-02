let express = require("express");
const { getMaxListeners } = require("../app");
const adminController = require("../controllers/admincontroller");
const adminHelper = require("../helpers/adminHelpers");
let router = express.Router();
const user = require("../models/connection");
const multer = require("../multer/multer");
const middleware = require("../middlewares/middleware");
const uploads = require("../multer/multer");
                   
router.get("/", middleware.adminSession, adminController.getDashboard);

router.get("/login", middleware.adminSession, adminController.getAdminLogin);

router.post("/login", adminController.postAdminLogin);

router.get("/logout", adminController.getAdminLogOut);

router.get("/view_users", middleware.adminSession, adminController.getViewUser);

router.get(
  "/block_users/:id",
  middleware.adminSession,
  adminController.getBlockUser
);

router.get(
  "/unblock_users/:id",
  middleware.adminSession,
  adminController.getUnblockUser
);

router.get(
  "/add_category",
  middleware.adminSession,
  adminController.getCategory
);

router.post("/add_category", adminController.postCategory);

router.get(
  "/delete_category/:id",
  middleware.adminSession,
  adminController.getDeleteCategory
);

router.get(
  "/add_product",
  middleware.adminSession,
  adminController.getAddProduct
);

router.post("/add_product", multer.uploads, adminController.postAddProduct);

router.get(
  "/view_product",
  middleware.adminSession,
  adminController.getViewproduct
);

router.get(
  "/edit_product/:id",
  middleware.adminSession,
  adminController.editViewProduct
);

router.post(
  "/edit_product/:id",
  multer.editeduploads,
  adminController.postEditAddProduct
);

// router.get(
//   "/delete_product/:id",
//   middleware.adminSession,
//   adminController.deleteViewProduct
// );

router.put(
  "/list_product/:id",
  middleware.adminSession,
  adminController.listProduct
);
router.put(
  "/unlist_product/:id",
  middleware.adminSession,
  adminController.unlistProduct
);

router.get(
  "/edit_category/:id",
  middleware.adminSession,
  adminController.getEditCategory
);

router.post(
  "/edit_category/:id",
  middleware.adminSession,
  adminController.postEditCategory
);

//************************************************************ */
//**********COUPON STARTS HERE************** */
//************************************************************ */

/*---------------Coupons----------------*/
router.get("/coupons", middleware.adminSession, adminController.newCoupons);

/*---------------Add-Coupons----------------*/
router.get("/add_coupons", middleware.adminSession, adminController.addCoupons);

router.post(
  "/add_coupons",
  middleware.adminSession,
  adminController.addNewCoupon
);

router.get(
  "/generate_coupon",
  middleware.adminSession,
  adminController.generateCoupon
);

router.delete(
  "/coupon_delete/:id",
  middleware.adminSession,
  adminController.deleteCoupon
);


router.get("/orders_list", middleware.adminSession, adminController.getOrderList)

router.get("/order_details", middleware.adminSession, adminController.getOrderDetails)

router.post("/order_details", middleware.adminSession, adminController. postOrderDetails)

router.get("/add_banner",middleware.adminSession, adminController.getAddBanner)

router.post("/add_banner",uploads.addBannerupload,middleware.adminSession, adminController.postAddBanner)

router.get("/list_banner",middleware.adminSession, adminController.listBanner)

router.get("/edit_banner",middleware.adminSession, adminController.getEditBanner)

router.post("/edit_banner",uploads.editBannerupload,middleware.adminSession, adminController.postEditBanner)

router.get('/sales_report',adminController.getSalesReport)
module.exports = router;
