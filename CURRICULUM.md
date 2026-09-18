# Curriculum map · แผนที่เนื้อหา

Content roadmap for Derive. Based on หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560), สสวท., then extended through university Calculus I–II.

**Verify against a current สสวท. textbook before authoring a topic.** Schools vary in ordering, and some add or skip chapters. This map is the plan, not the authority.

- ม.ต้น (ม.1–ม.3) has **no separate เพิ่มเติม track** in the core curriculum — it's one basic course, though many schools add enrichment material.
- ม.ปลาย splits into **คณิตศาสตร์พื้นฐาน** (everyone) and **คณิตศาสตร์เพิ่มเติม** (science/maths plan). They overlap in name but not in depth.

Topic ids are the strings used in code and in the database. Never renumber them.

---

## ม.ต้น · Lower secondary

### ม.1
**เทอม 1**
| id | ไทย | English |
|---|---|---|
| `int.basics` | จำนวนเต็ม | Integers |
| `geo.construction` | การสร้างทางเรขาคณิต | Geometric constructions |
| `exp.intro` | เลขยกกำลัง | Powers and exponents |
| `frac.decimals` | ทศนิยมและเศษส่วน | Decimals and fractions |
| `geo.2d3d` | รูปเรขาคณิตสองมิติและสามมิติ | 2D and 3D figures |

**เทอม 2**
| id | ไทย | English |
|---|---|---|
| `eq.linear-one-var` | สมการเชิงเส้นตัวแปรเดียว | Linear equations in one variable |
| `ratio.proportion` | อัตราส่วน สัดส่วน และร้อยละ | Ratio, proportion, percentage |
| `graph.linear-relations` | กราฟและความสัมพันธ์เชิงเส้น | Graphs and linear relationships |
| `stat.1` | สถิติ (1) | Statistics (1) |

### ม.2
**เทอม 1**
| id | ไทย | English |
|---|---|---|
| `geo.pythagoras` | ทฤษฎีบทพีทาโกรัส | Pythagorean theorem |
| `num.real-intro` | ความรู้เบื้องต้นเกี่ยวกับจำนวนจริง | Introduction to real numbers |
| `geo.prism-cylinder` | ปริซึมและทรงกระบอก | Prisms and cylinders |
| `geo.transformations` | การแปลงทางเรขาคณิต | Geometric transformations |
| **`exponents-radicals`** | **สมบัติของเลขยกกำลัง** | **Laws of exponents** — *v1 pilot* |
| `poly.intro` | พหุนาม | Polynomials |

**เทอม 2**
| id | ไทย | English |
|---|---|---|
| `stat.2` | สถิติ (2) | Statistics (2) |
| `geo.congruence` | ความเท่ากันทุกประการ | Congruence |
| `geo.parallel` | เส้นขนาน | Parallel lines |
| `geo.reasoning` | การให้เหตุผลทางเรขาคณิต | Geometric reasoning |
| `poly.factor-degree-2` | การแยกตัวประกอบของพหุนามดีกรีสอง | Factoring quadratics |

### ม.3
**เทอม 1**
| id | ไทย | English |
|---|---|---|
| `ineq.linear-one-var` | อสมการเชิงเส้นตัวแปรเดียว | Linear inequalities in one variable |
| `poly.factor-higher` | การแยกตัวประกอบของพหุนามดีกรีสูงกว่าสอง | Factoring higher-degree polynomials |
| **`quadratic-equations`** | **สมการกำลังสองตัวแปรเดียว** | **Quadratic equations** — *v1 pilot* |
| `geo.similarity` | ความคล้าย | Similarity |
| `func.quadratic-graph` | กราฟของฟังก์ชันกำลังสอง | Graphs of quadratic functions |
| `stat.3` | สถิติ (3) — แผนภาพกล่อง | Statistics (3) — box plots |

**เทอม 2**
| id | ไทย | English |
|---|---|---|
| `eq.system-linear-2var` | ระบบสมการเชิงเส้นสองตัวแปร | Systems of linear equations |
| `geo.circle` | วงกลม | Circles |
| `geo.pyramid-cone-sphere` | พีระมิด กรวย และทรงกลม | Pyramids, cones, spheres |
| `prob.intro` | ความน่าจะเป็น | Probability |
| `trig.ratios` | อัตราส่วนตรีโกณมิติ | Trigonometric ratios |

---

## ม.ปลาย · คณิตศาสตร์พื้นฐาน (basic track)

The A-Level คณิตศาสตร์ประยุกต์ 2 exam draws from exactly this list, which makes it a good sanity check on coverage.

| id | ไทย | English |
|---|---|---|
| `set.basic` | เซต | Sets |
| `logic.basic` | ตรรกศาสตร์เบื้องต้น | Elementary logic |
| `num.real-basic` | จำนวนจริง | Real numbers |
| `exp.basic` | เลขยกกำลัง | Exponents |
| `func.basic` | ฟังก์ชัน | Functions |
| `trig.ratios-applied` | อัตราส่วนตรีโกณมิติและการนำไปใช้ | Trigonometric ratios and applications |
| `seq.basic` | ลำดับและอนุกรม | Sequences and series |
| `finance.interest` | ดอกเบี้ยและมูลค่าของเงิน | Interest and the time value of money |
| `count.basic` | หลักการนับเบื้องต้น | Counting principles |
| `prob.basic` | ความน่าจะเป็น | Probability |
| `stat.basic` | สถิติ | Statistics |

---

## ม.ปลาย · คณิตศาสตร์เพิ่มเติม (advanced track)

### ม.4
| id | ไทย | English |
|---|---|---|
| `set.adv` | เซต | Sets |
| `logic.adv` | ตรรกศาสตร์ | Logic — propositions, equivalence, tautology, quantifiers |
| `num.real-adv` | จำนวนจริง | Real numbers — polynomials, polynomial equations and inequalities, absolute value |
| `func.relations` | ความสัมพันธ์และฟังก์ชัน | Relations and functions — operations, inverses, graphs |
| `func.exp-log` | ฟังก์ชันเอกซ์โพเนนเชียลและลอการิทึม | Exponential and logarithmic functions |
| `geo.analytic-conics` | เรขาคณิตวิเคราะห์และภาคตัดกรวย | Analytic geometry and conic sections |

### ม.5
| id | ไทย | English |
|---|---|---|
| `trig.functions` | ฟังก์ชันตรีโกณมิติ | Trigonometric functions — identities, equations, laws of sines/cosines |
| `matrix` | เมทริกซ์ | Matrices — determinants, inverses, linear systems |
| `vector` | เวกเตอร์ | Vectors — 3D coordinates, dot and cross products |
| `complex` | จำนวนเชิงซ้อน | Complex numbers — polar form, nth roots |
| `count.adv` | หลักการนับเบื้องต้น | Counting — permutations, combinations, binomial theorem |
| `prob.adv` | ความน่าจะเป็น | Probability |

### ม.6
| id | ไทย | English |
|---|---|---|
| `seq.adv` | ลำดับและอนุกรม | Sequences and series — limits of sequences, sigma notation |
| `calc.intro` | แคลคูลัสเบื้องต้น | Introductory calculus — limits, continuity, derivatives, antiderivatives, area under a curve |
| `stat.meaning` | ความหมายของสถิติศาสตร์และข้อมูล | Statistics and data |
| `stat.qualitative` | การวิเคราะห์และนำเสนอข้อมูลเชิงคุณภาพ | Qualitative data analysis |
| `stat.quantitative` | การวิเคราะห์และนำเสนอข้อมูลเชิงปริมาณ | Quantitative data analysis |
| `stat.random-var` | ตัวแปรสุ่มและการแจกแจงความน่าจะเป็น | Random variables and probability distributions |

---

## University · Calculus I–II

Beyond the school curriculum. Thai names follow typical Thai university usage (แคลคูลัส 1 / แคลคูลัส 2).

### Calculus I
| id | ไทย | English |
|---|---|---|
| `c1.limits` | ลิมิตและความต่อเนื่อง | Limits and continuity |
| `c1.derivative` | อนุพันธ์และกฎการหาอนุพันธ์ | Derivatives and differentiation rules |
| `c1.chain` | กฎลูกโซ่ และการหาอนุพันธ์โดยปริยาย | Chain rule, implicit differentiation |
| `c1.applications` | การประยุกต์ของอนุพันธ์ | Applications — extrema, curve sketching, related rates, optimisation |
| `c1.mvt` | ทฤษฎีบทค่าเฉลี่ย | Mean value theorem |
| `c1.integral-intro` | ปริพันธ์ไม่จำกัดเขตและปริพันธ์จำกัดเขต | Indefinite and definite integrals |
| `c1.ftc` | ทฤษฎีบทหลักมูลของแคลคูลัส | Fundamental theorem of calculus |

### Calculus II
| id | ไทย | English |
|---|---|---|
| `c2.techniques` | เทคนิคการหาปริพันธ์ | Integration techniques — by parts, trig substitution, partial fractions |
| `c2.improper` | ปริพันธ์ไม่ตรงแบบ | Improper integrals |
| `c2.applications` | การประยุกต์ของปริพันธ์ | Applications — area, volume, arc length, surface area |
| `c2.sequences-series` | ลำดับและอนุกรมอนันต์ | Infinite sequences and series |
| `c2.convergence` | การทดสอบการลู่เข้า | Convergence tests |
| `c2.power-series` | อนุกรมกำลังและอนุกรมเทย์เลอร์ | Power series and Taylor series |
| `c2.polar-parametric` | พิกัดเชิงขั้วและสมการอิงตัวแปรเสริม | Polar coordinates and parametric equations |

---

## Build order

Not the same as school order. Build what unblocks the most downstream skills.

1. **`exponents-radicals`**, **`quadratic-equations`** — v1 pilot. Rule-heavy, ideal for the step engine, prerequisites for almost everything later.
2. `poly.factor-degree-2`, `poly.factor-higher`, `eq.linear-one-var`, `ineq.linear-one-var` — the algebra spine.
3. `func.quadratic-graph`, `func.relations`, `func.exp-log` — functions, needed before calculus.
4. `trig.ratios` → `trig.functions`.
5. `seq.basic` → `seq.adv`.
6. `calc.intro` → `c1.*` → `c2.*`.
7. Statistics and probability strands, in parallel and independent of the above.
8. Geometry strand last — construction and proof questions are the hardest to generate and will need mostly hand-written items.

### Sources used for this map
- สสวท. หลักสูตรกลุ่มสาระการเรียนรู้คณิตศาสตร์ (ฉบับปรับปรุง พ.ศ. 2560) — ipst.ac.th/curriculum
- Chapter breakdowns from SmartMathPro and WE By The Brain (ม.ต้น and ม.ปลาย summaries, both updated 2026)
- A-Level คณิตศาสตร์ประยุกต์ 2 blueprint, for the พื้นฐาน track scope
