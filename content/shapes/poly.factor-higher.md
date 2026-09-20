# poly.factor-higher

Question shapes seen in real papers and textbook exercises, and which
generator covers each. See `docs/CONTENT-PIPELINE.md` §2.

## poly.cubes
- [x] `x^3 ± q^3` → `poly.cubes`
- [x] Leading coefficient, `p^3x^3 ± q^3` → `poly.cubes`
- [x] Common factor first, then a pair of cubes → `poly.cubes`
- [x] Common factor *and* a leading coefficient → `poly.cubes`
- [ ] Two variables, `p^3x^3 ± q^3y^3`
- [ ] Sixth powers, where the same expression is both a difference of squares and of cubes
- [ ] Decide whether a given binomial is a difference of cubes at all

## poly.higher-grouping
- [x] Four terms, `x^3 + ax^2 + bx + ab` → `poly.higher-grouping`
- [x] Mixed signs, so the second pair takes a minus out → `poly.higher-grouping`
- [x] Leading coefficient, `px^3 + ax^2 + pbx + ab` → `poly.higher-grouping`
- [x] The quadratic left behind is a difference of squares → `poly.higher-grouping`
- [ ] Terms given out of order, so the pairing has to be chosen
- [ ] The quadratic left behind is a perfect square trinomial

## poly.factor-theorem
- [x] Three distinct positive roots → `poly.factor-theorem`
- [x] Mixed signs → `poly.factor-theorem`
- [x] A repeated root, so the answer is squared → `poly.factor-theorem`
- [x] One rational root and an irreducible quadratic → `poly.factor-theorem`
- [ ] Leading coefficient greater than 1, so the root is a fraction
- [ ] Degree four, where the theorem has to be used twice
- [ ] Given that `(x - r)` is a factor, find the missing coefficient k
- [ ] Remainder theorem: find the remainder without dividing
