var express = require('express');
var router = express.Router();
let User = require('../models/User');
const Income = require('../models/Income');

// render addIncome form
router.get('/new', (req, res, next) => {
  console.log(req.user);
  res.render('addIncomeForm');
});

// add income
router.post('/new', (req, res, next) => {
  req.body.user = req.user._id;
  req.body.incomeSource = req.body.incomeSource
    .trim()
    .split(' ')
    .map((e) => e.toLowerCase());
  Income.create(req.body, (err, income) => {
    if (err) return next(err);
    User.findByIdAndUpdate(
      req.user.id,
      { $push: { incomes: income.id } },
      (err, user) => {
        if (err) return next(err);
        res.redirect('/users/statementList');
      }
    );
  });
});

// // render single income page
// router.get("/:id", (req,res,next)=>{
//   let id = req.params.id;
//   Income.findById(id, (err, income)=>{
//     if(err) return next(err);
//     console.log(income)
//     const date = new Date (income.incomeDate).toISOString().split("T")[0];
//     console.log(date);
//     res.render("incomeDetails", {income, date});
//   });
// });

module.exports = router;
