let mongoose = require('mongoose');

let Schema = mongoose.Schema;

let incomeSchema = new Schema({
  name: { type: String },
  incomeSource: [{ type: String }],
  incomeAmount: { type: Number },
  incomeDate: { type: Date },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
});

incomeSchema.index({ incomeSource: 1 });
incomeSchema.index({ incomeDate: 1 });

incomeSchema.sumOfIncomes = function (incomes) {
  incomes.reduce((prev, curr) => {
    prev += curr.incomeAmount;
    return prev;
  }, 0);
};

let Income = mongoose.model('Income', incomeSchema);

module.exports = Income;
