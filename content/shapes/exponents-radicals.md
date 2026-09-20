# exponents-radicals

Question shapes seen in real papers and textbook exercises, and which
generator covers each. An empty checkbox is next week's work, already scoped.
See `docs/CONTENT-PIPELINE.md` §2.

## exp.integer-laws
- [x] Product of powers, same base, positive exponents → `exp.laws-core`
- [x] Quotient of powers, same base → `exp.laws-core`
- [x] Power of a power → `exp.laws-core`
- [x] Power of a product with a coefficient → `exp.laws-core`
- [x] Quotient with a bracket on top, coefficients divide → `exp.laws-core`
- [ ] Two different bases that share a common base (`4^n` as `2^{2n}`)
- [ ] Power of a quotient, `\left(\frac{a}{b}\right)^n`

## exp.negative-zero
- [x] Numeric negative exponent → `exp.zero-negative`
- [x] `a^0` reached through a quotient → `exp.zero-negative`
- [x] Coefficient times a negative power of a variable → `exp.zero-negative`
- [x] Quotient where the bottom exponent is larger → `exp.zero-negative`
- [x] Negative exponent outside a bracket that already holds one → `exp.zero-negative`
- [ ] Negative exponents on both top and bottom of a fraction

## exp.scientific
- [x] Write a large number in scientific notation → `exp.scientific-notation`
- [x] Write a small decimal in scientific notation → `exp.scientific-notation`
- [x] Multiply two numbers in scientific notation, renormalise → `exp.scientific-notation`
- [x] Divide two numbers in scientific notation → `exp.scientific-notation`
- [ ] Add two numbers in scientific notation (needs a common exponent first)
- [ ] Word problem: distance, mass or population, answer in scientific notation

## rad.simplify
- [x] `\sqrt{n}` with one perfect-square factor → `rad.simplify-sqrt`
- [x] Coefficient already outside the root → `rad.simplify-sqrt`
- [x] Product of two roots, simplify afterwards → `rad.simplify-sqrt`
- [x] Quotient of two roots, combine then simplify → `rad.simplify-sqrt`
- [ ] Radicand with a variable, `\sqrt{18x^2}` (needs the absolute-value discussion)

## rad.operations
- [x] Add or subtract like radicals → `rad.operations-core`
- [x] Terms that only match after each is simplified → `rad.operations-core`
- [x] Three terms, mixed signs → `rad.operations-core`
- [x] Conjugate product, radicals vanish → `rad.operations-core`
- [ ] `(a + \sqrt{b})^2`, the middle term learners drop
- [ ] Multiply two radicals with coefficients, `2\sqrt{6} \cdot 3\sqrt{10}`

## rad.rationalize
- [x] `\frac{a}{\sqrt{b}}` → `rad.rationalize-core`
- [x] `\frac{c}{p \pm \sqrt{b}}`, conjugate → `rad.rationalize-core`
- [ ] `\frac{\sqrt{a}}{\sqrt{b}}` where the answer reduces
- [ ] `\frac{c}{\sqrt{a} - \sqrt{b}}`, conjugate of two radicals

## exp.rational
- [x] A root written as a fractional power, evaluated -> `exp.rational-core`
- [x] A fractional power written as a root, evaluated -> `exp.rational-core`
- [x] A numerator above one, root first -> `exp.rational-core`
- [x] A negative rational exponent -> `exp.rational-core`
- [ ] A rational exponent on a variable base, left symbolic
- [ ] A product of two fractional powers of the same base
- [ ] A rational exponent inside a surd needing simplifying first
- [ ] Comparing `a^{1/2}` and `a^{1/3}` for a between 0 and 1
