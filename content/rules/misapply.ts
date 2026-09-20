import {
  ConstantNode,
  FunctionNode,
  OperatorNode,
  SymbolNode,
  parse,
  type MathNode,
} from "mathjs";

/**
 * The machinery behind `Misapplication.apply` (see `content/types.ts`).
 *
 * A mis-application has to be *mechanical*: given the mathjs form of a step,
 * either it produces the expression the mistake produces, or it says the
 * mistake cannot be made here. Doing that by string surgery is how you end up
 * with a "diagnosis" that fires on the wrong shape, and a confidently wrong
 * diagnosis is worse than none - so these work on the parsed tree.
 *
 * Everything here returns `null` rather than throwing. These run speculatively
 * over every step of a derivation, so "does not apply" is the ordinary answer.
 */

/**
 * Rewrites the first subtree `visit` claims, and returns the new expression -
 * or `null` if nothing was claimed, or the input does not parse.
 *
 * First rather than all: a mis-application is one slip, not a policy. A
 * learner who multiplies exponents in `x^2 x^3 y^4 y^5` has usually done it
 * once and got the other one right, and the diagnosis is checked against what
 * they actually submitted anyway.
 */
export function rewriteFirst(
  math: string,
  visit: (node: MathNode) => MathNode | null,
): string | null {
  let root: MathNode;
  try {
    root = parse(math);
  } catch {
    return null;
  }

  let done = false;
  try {
    const next = root.transform((node) => {
      if (done) return node;
      const replacement = visit(node);
      if (!replacement) return node;
      done = true;
      return replacement;
    });
    return done ? next.toString() : null;
  } catch {
    return null;
  }
}

type Op = { op: string; args: MathNode[] };

/** The node as a binary operator of this symbol, or null. */
export function asOperator(node: MathNode, op: string): Op | null {
  if (node.type !== "OperatorNode") return null;
  const operator = node as unknown as Op;
  if (operator.op !== op || operator.args.length !== 2) return null;
  return operator;
}

export function unparen(node: MathNode): MathNode {
  let current = node;
  while (current.type === "ParenthesisNode") {
    current = (current as unknown as { content: MathNode }).content;
  }
  return current;
}

/** Structural sameness, which for our purposes is sameness of source. */
export function same(a: MathNode, b: MathNode): boolean {
  return unparen(a).toString() === unparen(b).toString();
}

/** mathjs wants the operator *and* its function name; keep them together. */
const FUNCTIONS = {
  "+": "add",
  "-": "subtract",
  "*": "multiply",
  "/": "divide",
  "^": "pow",
} as const;

/** The handful of operators these rewrites build. */
export type BinaryOp = keyof typeof FUNCTIONS;

export function isBinaryOp(op: string): op is BinaryOp {
  return Object.hasOwn(FUNCTIONS, op);
}

/** A binary node of the same operator as one you matched, with new arguments. */
export function binary(op: string, a: MathNode, b: MathNode): MathNode {
  if (!isBinaryOp(op)) {
    throw new Error(`misapply: no mathjs function for "${op}"`);
  }
  return new OperatorNode(op, FUNCTIONS[op], [a, b]);
}

export const add = (a: MathNode, b: MathNode) => binary("+", a, b);
export const subtract = (a: MathNode, b: MathNode) => binary("-", a, b);
export const multiply = (a: MathNode, b: MathNode) => binary("*", a, b);
export const divide = (a: MathNode, b: MathNode) => binary("/", a, b);
export const power = (a: MathNode, b: MathNode) => binary("^", a, b);
export const negate = (a: MathNode) =>
  new OperatorNode("-", "unaryMinus", [a]);

/**
 * The node as a call to one of these functions, or null.
 *
 * Trigonometry needs this: the mistakes worth naming there are about what a
 * function was applied to - `\sin(A + B)` turned into `\sin A + \sin B` - and
 * that shape is a call, not an operator.
 */
export function asCall(
  node: MathNode,
  names: readonly string[],
): { name: string; args: MathNode[] } | null {
  if (node.type !== "FunctionNode") return null;
  const call = node as unknown as { fn: { name?: string }; args: MathNode[] };
  const name = call.fn?.name;
  if (!name || !names.includes(name)) return null;
  return { name, args: call.args };
}

/** A call to `name` with one argument. */
export function call(name: string, argument: MathNode): MathNode {
  return new FunctionNode(new SymbolNode(name), [argument]);
}

/** A plain number, for a rewrite that needs to put one somewhere. */
export function constant(value: number): MathNode {
  return new ConstantNode(value);
}

/** True when the expression is a number with no letters in it. */
export function isConstant(math: string): boolean {
  try {
    let found = false;
    parse(math).traverse((node, path, parent) => {
      if (node.type !== "SymbolNode") return;
      if (parent?.type === "FunctionNode" && path === "fn") return;
      found = true;
    });
    return !found;
  } catch {
    return false;
  }
}
