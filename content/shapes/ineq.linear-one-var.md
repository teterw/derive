# ineq.linear-one-var

Question shapes seen in real papers and textbook exercises, and which
generator covers each. See `docs/CONTENT-PIPELINE.md` §2.

## ineq.linear.solve
- [x] One move, `x + c <rel> k`, no flip → `ineq.linear.solve`
- [x] Positive coefficient, so dividing does not flip → `ineq.linear.solve`
- [x] Negative coefficient, so dividing flips → `ineq.linear.solve`
- [x] The variable on both sides, leaving a negative coefficient → `ineq.linear.solve`
- [ ] Brackets on both sides
- [ ] A compound inequality, `-3 < 2x + 1 \leq 7`
- [ ] Reading the solution off a number line, or drawing one
- [ ] Denominators, so the fractions have to be cleared first

## ineq.linear.integers
- [x] Whole boundary, sign includes it → `ineq.linear.integers`
- [x] Whole boundary, sign excludes it → `ineq.linear.integers`
- [x] Fractional boundary, round into the range → `ineq.linear.integers`
- [x] Negative coefficient, so the direction flips first → `ineq.linear.integers`
- [ ] How many whole numbers satisfy it, rather than which is largest
- [ ] Positive integers only, so zero and the negatives are excluded

## ineq.linear.word
- [x] A budget: how many can be bought → `ineq.linear.word`
- [x] A fare with a fixed starting charge → `ineq.linear.word`
- [x] An average with a floor, so the answer is a minimum → `ineq.linear.word`
- [x] A perimeter with a ceiling → `ineq.linear.word`
- [ ] Two items at different prices with one total budget
- [ ] A phone plan: fixed monthly fee plus per-minute charge
- [ ] Profit must exceed cost
