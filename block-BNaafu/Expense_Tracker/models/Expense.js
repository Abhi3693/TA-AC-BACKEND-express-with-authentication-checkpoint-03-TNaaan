let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let ExpenseSchema = new Schema({
  name: { type: String },
  expenseCategory: [{ type: String }],
  expenseAmount: { type: Number },
  expenseDate: { type: Date },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
});

ExpenseSchema.sumOfExpenses = function (expenses) {
  expenses.reduce((prev, curr) => {
    prev += curr.expenseAmount;
    return prev;
  }, 0);
};

let Expense = mongoose.model('Expense', ExpenseSchema);

module.exports = Expense;
