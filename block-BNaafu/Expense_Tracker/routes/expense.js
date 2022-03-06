var express = require('express');
var router = express.Router();
let User = require("../models/User");
const Expense = require('../models/Expense');



// render addIncome form
router.get("/new", (req,res,next)=>{
  res.render("addExpenseForm");
});

// add expense
router.post("/new", (req,res,next)=>{
  req.body.user = req.user._id;
  req.body.expenseCategory = req.body.expenseCategory.trim().split(" ").map((e)=> e.toLowerCase());
  Expense.create(req.body, (err, expense)=>{
    if(err) return next(err);
    User.findByIdAndUpdate(req.user.id, {$push: {expenses: expense.id }}, (err, user)=>{
      if(err) return next(err);
      res.redirect("/expense/" + expense.id);
    });
  });
});

// render single expense page
router.get("/:id", (req,res,next)=>{
  let id = req.params.id;
  Expense.findById(id, (err, expense)=>{
    if(err) return next(err);
    console.log(expense)
    const date = new Date (expense.expenseDate).toISOString().split("T")[0]; 
    res.render("expenseDetails", {expense, date});
  });
});



module.exports = router;
