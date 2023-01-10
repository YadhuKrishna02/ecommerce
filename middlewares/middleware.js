module.exports = {
  userSession: (req, res, next) => {
    if (req.session.userLoggedIn) {
      next();
    } else {
      res.render("user/login");
    }
  },
  adminSession: (req, res, next) => {
    // console.log(req.session.admin);

    if (req.session.admin) {
      next();
    } else {
      res.render("admin/loginNew", {
        layout: "adminLayout",
        adminStatus: false,
      });
    }
  },
  // userSignupSession: (req, res, next) => {
  //   if (req.session.userLoggedIn) {
  //     next();
  //   } else {
  //     res.render("user/signup");
  //   }
  // },
};
