var express = require('express');
var router = express.Router();
let User = require('../models/User');
let Expense = require('../models/Expense');
let Income = require('../models/Income');
let auth = require('../middlewares/auth');
let moment = require('moment');
let bcrypt = require('bcrypt');
const VerifyEmail = require('../models/EmailVarify');

/* GET users listing. */

function sumAllExpenses(elm) {
  return elm.reduce((prev, curr) => {
    prev += curr.expenseAmount;
    return prev;
  }, 0);
}

function sumAllIncomes(elm) {
  return elm.reduce((prev, curr) => {
    prev += curr.incomeAmount;
    return prev;
  }, 0);
}

// render Statelemt savings data
router.use((req, res, next) => {
  let date = new Date();
  let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  if (req.user || req.session.passport) {
    Expense.aggregate(
      [
        {
          $match: {
            user: req.user._id,
            expenseDate: { $gte: firstDay, $lt: lastDay },
          },
        },
        {
          $group: {
            _id: null,
            totalExpense: { $sum: '$expenseAmount' },
          },
        },
      ],
      (err, expenseAmount) => {
        if (err) return next(err);
        Income.aggregate(
          [
            {
              $match: {
                user: req.user._id,
                incomeDate: { $gte: firstDay, $lt: lastDay },
              },
            },
            {
              $group: {
                _id: null,
                totalIncome: { $sum: '$incomeAmount' },
              },
            },
          ],
          (err, incomeAmount) => {
            if (err) return next(err);
            if (incomeAmount.length && expenseAmount.length) {
              let savings =
                incomeAmount[0].totalIncome - expenseAmount[0].totalExpense;
              res.locals.savings = savings;
              res.locals.balance = 0;
            } else {
              // let savings = incomeAmount[0].totalIncome - expenseAmount[0].totalExpense;
              res.locals.savings = 0;
              res.locals.balance = 0;
            }
            next();
          }
        );
      }
    );
  } else {
    next();
  }
});

// render new user form
router.get('/new/:id', (req, res, next) => {
  VerifyEmail.findById(req.params.id, (err, content) => {
    if (err) return next(err);
    let error = req.flash('error');
    res.render('register', { error, content });
  });
});

// render login form
router.get('/login', (req, res, next) => {
  let error = req.flash('error');
  res.render('login', { error });
});

// render new user
router.post('/new', (req, res, next) => {
  User.create(req.body, (err, user) => {
    if (err) {
      req.flash('error', 'name,password,email required');
      return res.redirect('/users/new');
    } else {
      res.redirect('/users/login');
    }
  });
});

// login user
router.post('/login', (req, res, next) => {
  let { email, password } = req.body;

  //  email-password is not given
  if (!email || !password) {
    req.flash('error', 'Email/password required');
    res.redirect('/users/login');
  } else {
    //  found email
    User.findOne({ email }, (err, user) => {
      if (err) return next(err);
      if (user) {
        user.verifypassword(password, (err, result) => {
          if (err) return next(err);

          // Password not matched
          if (!result) {
            req.flash('error', 'Enter valid Password');
            return res.redirect('/users/login');
          } else {
            // password Matched
            req.session.userId = user._id;
            return res.redirect('/users/statementList');
          }
        });

        // Registered email not found
      } else {
        req.flash('error', 'Enter registered Email');
        res.redirect('/users/login');
      }
    });
  }
});

//  render Set new Password form
router.get('/newPassword', (req, res, next) => {
  let error = req.flash('error');
  res.render('newPassword', { error });
});

//  Add new password
router.post('/newPassword', (req, res, next) => {
  let { email, password, confirm } = req.body;

  User.findOne({ email }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error', 'Enter registered Email');
      res.redirect('/users/resetPassword');
    } else {
      if (password !== confirm) {
        req.flash('error', 'Password and confirmed password is not matching');
        return res.redirect('/users/newPassword');
      } else {
        password = bcrypt.hashSync(password, 10, (err, hashed) => {
          if (err) return next(err);
          return hashed;
        });

        User.findByIdAndUpdate(
          user._id,
          { password },
          { new: true },
          (err, newUser) => {
            if (err) return next(err);
            req.session.userId = user._id;
            res.redirect('/users/dashboard');
          }
        );
      }
    }
  });
});

// Auth for user loggedin
router.use(auth.isUserLogged);

// Logout User
router.get('/logout', (req, res, next) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.redirect('/');
});

let date = new Date();
let currentMonth = moment(date).format('MMMM');

// Statement page details
router.get('/statementlist', async (req, res, next) => {
  let currDate = new Date();
  if (
    req.query.startDate &&
    req.query.endDate &&
    req.query.incomeSource &&
    req.query.expenseCategory
  ) {
    let startDate = req.query.startDate;
    let endDate = req.query.endDate;
    let incomeSource = req.query.incomeSource;
    let expenseCategory = req.query.expenseCategory;

    let incomes = await Income.find({
      user: req.user.id,
      incomeSource: incomeSource,
      incomeDate: { $gte: new Date(startDate), $lt: new Date(endDate) },
    });
    let expenses = await Expense.find({
      user: req.user.id,
      expenseCategory: expenseCategory,
      expenseDate: { $gte: new Date(startDate), $lt: new Date(endDate) },
    });

    let sumOfIncomes = sumAllIncomes(incomes);
    let sumOfExpenses = sumAllExpenses(expenses);
    let balance = sumOfIncomes - sumOfExpenses;
    return res.render('incomeExpenseStatement', {
      incomes,
      expenses,
      currentMonth,
      balance,
    });
  }

  if (req.query.month) {
    let month = req.query.month.split('-')[1];
    let currntYear = moment(currDate).format('YYYY');
    let date = new Date(currntYear + '-' + month + '-' + '01');
    let firstDate = new Date(date.getFullYear(), date.getMonth(), 01);
    let endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    let expenses = await Expense.find({
      user: req.user.id,
      expenseDate: { $gte: new Date(firstDate), $lt: new Date(endDate) },
    });
    let incomes = await Income.find({
      user: req.user.id,
      incomeDate: { $gte: new Date(firstDate), $lt: new Date(endDate) },
    });

    let sumOfIncomes = sumAllIncomes(incomes);
    let sumOfExpenses = sumAllExpenses(expenses);
    let balance = sumOfIncomes - sumOfExpenses;
    return res.render('incomeExpenseStatement', {
      incomes,
      expenses,
      currentMonth,
      balance,
    });
  }

  if (req.query.month || req.query.firstDate || req.query.endDate) {
    firstDate = req.query.firstDate;
    endDate = req.query.endDate;
    let expenses = await Expense.find({
      user: req.user.id,
      expenseDate: { $gte: new Date(firstDate), $lt: new Date(endDate) },
    });
    let incomes = await Income.find({
      user: req.user.id,
      incomeDate: { $gte: new Date(firstDate), $lt: new Date(endDate) },
    });

    let sumOfIncomes = sumAllIncomes(incomes);
    let sumOfExpenses = sumAllExpenses(expenses);
    let balance = sumOfIncomes - sumOfExpenses;
    return res.render('incomeExpenseStatement', {
      incomes,
      expenses,
      currentMonth,
      balance,
    });
  }

  if (req.query.incomeSource && req.query.expenseCategory) {
    let incomes = await Income.find({
      user: req.user.id,
      incomeSource: req.query.incomeSource,
    });
    let expenses = await Expense.find({
      user: req.user.id,
      expenseCategory: req.query.expenseCategory,
    });

    let sumOfIncomes = sumAllIncomes(incomes);
    let sumOfExpenses = sumAllExpenses(expenses);
    let balance = sumOfIncomes - sumOfExpenses;
    return res.render('incomeExpenseStatement', {
      incomes,
      expenses,
      currentMonth,
      balance,
    });
  }

  let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  let expenses = await Expense.find({
    user: req.user.id,
    expenseDate: { $gte: firstDay, $lt: lastDay },
  });
  let incomes = await Income.find({
    user: req.user.id,
    incomeDate: { $gte: firstDay, $lt: lastDay },
  });

  let sumOfIncomes = sumAllIncomes(incomes);
  let sumOfExpenses = sumAllExpenses(expenses);
  let balance = sumOfIncomes - sumOfExpenses;
  return res.render('incomeExpenseStatement', {
    incomes,
    expenses,
    currentMonth,
    balance,
  });
});

module.exports = router;
