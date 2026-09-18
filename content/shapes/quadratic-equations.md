# quadratic-equations

Question shapes seen in real papers and textbook exercises, and which
generator covers each. See `docs/CONTENT-PIPELINE.md` §2.

## quad.factor-common
- [x] `ax^2 + bx`, common factor is `x` → `quad.factor-common`
- [x] Numeric and variable common factor, `6x^2 + 9x` → `quad.factor-common`
- [x] Three terms, common factor leaves a trinomial → `quad.factor-common`
- [x] Negative common factor → `quad.factor-common`

## quad.factor-trinomial
- [x] `x^2 + bx + c`, both roots positive → `quad.factor-trinomial`
- [x] Mixed signs → `quad.factor-trinomial`
- [x] Leading coefficient greater than 1 → `quad.factor-trinomial`
- [x] Common factor hiding in front of a trinomial → `quad.factor-trinomial`
- [ ] Perfect square trinomial presented as an ordinary one
- [ ] Trinomial in a substituted variable, `x^4 - 5x^2 + 6`

## quad.diff-squares
- [x] `x^2 - k^2` → `quad.diff-squares`
- [x] `a^2x^2 - k^2` → `quad.diff-squares`
- [x] Common factor first, then difference of squares → `quad.diff-squares`
- [x] Fourth powers, factors twice → `quad.diff-squares`
- [ ] Difference of squares in two variables, `9x^2 - 16y^2`

## quad.solve-by-factoring
- [x] Standard form, integer roots, a = 1 → `quad.solve-factor-simple`
- [x] Needs rearranging into standard form first → `quad.solve-factor-simple`
- [x] Leading coefficient > 1, one root a fraction → `quad.solve-factor-leading`
- [x] `ax^2 = bx`, where dividing by x loses a root → `quad.solve-common-factor`
- [ ] Given one root, find the missing coefficient k
- [ ] Equation with brackets on both sides that expand to a quadratic

## quad.completing-square
- [x] b even, perfect square on the right, integer roots → `quad.completing-square`
- [x] b even, surd roots → `quad.completing-square`
- [x] b odd, quarters throughout → `quad.completing-square`
- [x] Leading coefficient divided out first → `quad.completing-square`
- [ ] Rewrite in vertex form `a(x - h)^2 + k` without solving

## quad.formula
- [x] Rational roots, a = 1 → `quad.formula-core`
- [x] Surd roots, a = 1 → `quad.formula-core`
- [x] Leading coefficient, discriminant needs simplifying → `quad.formula-core`
- [x] Repeated root → `quad.formula-core`
- [ ] Coefficients that are themselves fractions

## quad.discriminant
- [x] Count the real roots of a given equation → `quad.discriminant-count`
- [ ] For what k does this have exactly one solution
- [ ] For what k does this have no real solution

## quad.word-problems
- [x] Rectangle: one side given in terms of the other, area given, negative root rejected → `quad.word-rectangle`
- [x] Two integers a fixed distance apart with a given product → `quad.word-consecutive`
- [ ] Rectangle with perimeter *and* area given
- [ ] Projectile height: when does it reach a given height
- [ ] Consecutive integers whose squares sum to a given value
