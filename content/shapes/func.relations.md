# func.relations

Question shapes seen in real papers and textbook exercises, and which
generator covers each. See `docs/CONTENT-PIPELINE.md` section 2.

## func.evaluate
- [x] Linear function at a whole number -> `func.evaluate`
- [x] Linear with larger coefficients, including negatives -> `func.evaluate`
- [x] Quadratic at a negative number, where the square catches people -> `func.evaluate`
- [x] Evaluated at an expression, so the answer is an expression -> `func.evaluate`
- [ ] A piecewise function, where the input decides which rule applies
- [ ] Given f(a), find a
- [ ] A function defined by a table or a set of ordered pairs

## func.composite
- [x] Two linear functions -> `func.composite`
- [x] Two linear functions with negative coefficients -> `func.composite`
- [x] Quadratic outside, linear inside -> `func.composite`
- [x] Composite evaluated at a number -> `func.composite`
- [ ] Linear outside, quadratic inside
- [ ] Three functions composed
- [ ] Given f and f(g(x)), find g

## func.inverse
- [x] Inverse of a linear function with coefficient one -> `func.inverse`
- [x] Small whole coefficient -> `func.inverse`
- [x] Any whole coefficient, so the answer is a fraction -> `func.inverse`
- [ ] Inverse of a simple rational function
- [ ] Showing that two given functions are inverses of each other
- [ ] Domain restriction needed for the inverse to be a function
