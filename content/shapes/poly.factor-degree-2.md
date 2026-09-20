# poly.factor-degree-2

Question shapes seen in real papers and textbook exercises, and which
generator covers each. See `docs/CONTENT-PIPELINE.md` §2.

The three shapes this chapter shares with `quadratic-equations` - common
factor, ordinary trinomial, difference of squares - are catalogued there, not
here, because that is where their generators live. See
`content/topics/poly-factor-degree-2.ts` for why.

## poly.perfect-square
- [x] `x^2 + 2qx + q^2`, both signs → `poly.perfect-square`
- [x] Leading coefficient, `p^2x^2 + 2pqx + q^2` → `poly.perfect-square`
- [x] Common factor in front of a perfect square → `poly.perfect-square`
- [ ] Told it is a perfect square, find the missing term
- [ ] Decide whether a given trinomial is a perfect square at all

## poly.grouping
- [x] Four terms, `a = 1`, all positive → `poly.grouping`
- [x] Four terms with mixed signs, so the second pair takes a minus out → `poly.grouping`
- [x] Leading coefficient, `ACx^2 + ADx + BCx + BD` → `poly.grouping`
- [x] Common factor first, then grouping → `poly.grouping`
- [ ] Terms given out of order, so the pairing has to be chosen
- [ ] Four terms in two variables, `xy + 3x + 2y + 6`

## poly.two-variables
- [x] Difference of squares, `a^2x^2 - b^2y^2` → `poly.two-variables`
- [x] Trinomial, `x^2 + (p+q)xy + pq y^2` → `poly.two-variables`
- [x] Trinomial with a leading coefficient → `poly.two-variables`
- [x] Common factor, then a difference of squares in two variables → `poly.two-variables`
- [ ] Perfect square in two variables, `a^2x^2 + 2abxy + b^2y^2`
- [ ] Three variables, or a variable in the exponent

## poly.substitution
- [x] `x^4 + bx^2 + c`, stops at two quadratic brackets → `poly.substitution`
- [x] `x^4 + bx^2 + c` where both brackets factor again → `poly.substitution`
- [x] Leading coefficient, `ax^4 + bx^2 + c` → `poly.substitution`
- [x] The chunk is a bracket, `(x+k)^2 - m(x+k) + n` → `poly.substitution`
- [ ] `x^6 + bx^3 + c`, where the chunk is a cube
- [ ] A chunk that only appears after a common factor comes out
