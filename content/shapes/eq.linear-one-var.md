# eq.linear-one-var

Question shapes seen in real papers and textbook exercises, and which
generator covers each. See `docs/CONTENT-PIPELINE.md` §2.

## eq.linear.solve
- [x] One move, `x + c = k` or `ax = k` → `eq.linear.solve`
- [x] Two moves, `ax + c = k` → `eq.linear.solve`
- [x] The variable on both sides, `ax + c = bx + d` → `eq.linear.solve`
- [x] Brackets on both sides, `a(x + c) = b(x + d)` → `eq.linear.solve`
- [ ] A negative coefficient on the variable, `7 - 2x = 1`
- [ ] No solution, or every number a solution
- [ ] Decimal coefficients

## eq.linear.fractions
- [x] One fraction and a whole number, `x/n + c = k` → `eq.linear.fractions`
- [x] The whole numerator over a denominator, `(x + c)/n = k` → `eq.linear.fractions`
- [x] Two denominators, so the lowest common multiple matters → `eq.linear.fractions`
- [x] A fraction on each side, so cross-multiplying works → `eq.linear.fractions`
- [ ] Three denominators
- [ ] A fraction whose numerator is itself a bracket times a number

## eq.linear.word
- [x] A number puzzle in one step → `eq.linear.word`
- [x] A multiple of a number, then a subtraction → `eq.linear.word`
- [x] Ages, now and later → `eq.linear.word`
- [x] A rectangle from its perimeter → `eq.linear.word`
- [ ] Money: coins or notes of two denominations
- [ ] Consecutive integers with a given sum
- [ ] Distance, speed and time
- [ ] A ratio given as a sentence
