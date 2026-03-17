# Core Beliefs

Our foundational principles that guide every technical decision.

## Codebase Longevity

This codebase will outlive you.

Every line of code you write has a multi-year impact. The patterns you establish today will be copied by dozens of developers tomorrow. Shortcuts compound into technical debt that becomes harder to unwind with each passing month.

We fight entropy by refusing to let "good enough" slip through. A pattern that saves five minutes now costs hours later when multiplied across hundreds of files and multiple developers. Write code as if you will not be here to explain it, because you will not.

This is why our invariant checklist exists. Each item represents a battle we have chosen to fight against entropy. The checklist is not bureaucracy; it is our defense against the natural decay of software systems. When you follow it, you are not just following rules - you are preserving the integrity of the codebase for those who come after you.

Long-term thinking means choosing patterns that scale with complexity. What works in a prototype breaks in production. What works for one developer confuses a team. Build for the codebase you will have in two years, not the one you have today.

Every decision you make sets a precedent. If you skip a test today, the next developer will skip two. If you use `any` once, it becomes acceptable. Guard the standards fiercely.

## The Golden Rule - Boolean Pattern Origin

Explicit boolean checks are non-negotiable.

```typescript
// Correct
if (isValid === true) {
}

// Incorrect
if (isValid) {
}
```

This pattern exists for four reasons:

1. **Type Safety**: TypeScript's type narrowing behaves predictably with explicit comparisons. Implicit checks can narrow types in unexpected ways, especially with union types. When you write `=== true`, TypeScript knows exactly what you mean and can provide accurate autocomplete and error detection.

2. **Clarity**: Code reads like English - "if is valid equals true". Anyone reading this understands exactly what condition is being tested. There is no mental overhead to interpret what constitutes truthiness in this context. The intent is unambiguous.

3. **Bug Prevention**: Falsy values (0, "", null, undefined) do not trigger unexpected branches. An empty string is not false; it is an empty string. A zero is not false; it is a number. These distinctions matter and explicit checks force you to confront them rather than hiding behind JavaScript's coercion rules.

4. **Precedent**: One implicit check normalizes the pattern across the team. Explicit checks enforce discipline and make code reviews simpler. When the entire codebase follows this rule, developers spend less time debating style and more time solving problems. The consistency itself becomes a productivity multiplier.

When you see `=== true/false`, you know exactly what state is being checked. No surprises. No hidden assumptions about what counts as truthy. This single pattern eliminates entire categories of bugs.

## Explicit Over Implicit

Clarity through explicitness in every layer of the stack.

**Boolean checks**: `=== true/false` removes ambiguity about what constitutes truth. It forces you to think about what you are actually checking rather than relying on JavaScript's coercion rules.

**Return types**: Explicit annotations document contracts at a glance. A function signature tells you what goes in and what comes out without reading the implementation. This is especially critical for public API functions where consumers rely on stable contracts. When you change a return type, TypeScript immediately shows you every place that needs updating.

**Error handling**: Failures surface immediately; nothing fails silently. We do not swallow exceptions or return undefined to avoid dealing with errors. When something goes wrong, we want to know about it at the point of failure, not three layers up the call stack where the context is lost.

**Validation**: All external inputs pass through Zod before touching application logic. The boundary between the outside world and our internal types is strictly guarded. Never trust data from APIs, localStorage, or user input without validation. Zod schemas serve as both runtime guards and TypeScript type generators.

Implicit behavior is convenient today and mysterious tomorrow. Explicit code tells the truth about what it does. It does not hide behind conventions or assume the reader knows the same shortcuts you do. Explicit code is honest code.

When in doubt, be explicit. The reader will thank you.

## Self-Documenting Code

Write code that explains itself.

Variable names carry meaning: `isAuthenticated` over `auth`. Functions describe actions: `validateUserInput` over `check`. Extract complex logic into well-named functions that reveal intent without requiring readers to parse implementation details.

Comments explain _why_, never _what_. If you need a comment to explain what code does, rewrite the code. Comments are for assumptions, trade-offs, and context that code cannot express:

```typescript
// We use exponential backoff because the API has strict rate limits
// See: https://api.docs/rate-limiting
const delay = baseDelay * Math.pow(2, attempt);
```

This comment explains the reasoning behind the formula, not what the formula does. The code is clear; the comment provides the business context that justifies the approach.

Code is read ten times more often than it is written. Optimize for the reader. Future you is a reader. Future teammates are readers. Write for them. The time you spend choosing clear names and clean structures pays dividends every time someone reads that code.

Self-documenting code reduces the burden of external documentation. When the code speaks clearly, you need fewer documents to explain it. The code becomes the documentation.

Good names are the best comments you can write.

## Type Safety as Security

The `any` type is forbidden.

Types are not annotations; they are executable specifications. They catch bugs at compile time, make refactoring safe, and serve as living documentation. `any` undermines all of this.

When you use `any`:

- You lose compile-time error detection
- Refactoring becomes dangerous because the compiler cannot help you find all usages
- Other developers cannot trust the type system
- Runtime surprises emerge that TypeScript should have prevented

Every type annotation is a promise to the next developer. Breaking that promise with `any` creates technical debt that compounds silently until it breaks production.

We use the `T` prefix convention for type parameters to distinguish them from runtime values. This makes generic code easier to read and maintain. When you see `TResult`, you know immediately that this is a type variable, not a concrete type.

Type safety is a form of automated testing. It proves that certain errors cannot exist in your code. Do not give up this safety for momentary convenience.

## Local-First Philosophy

Users own their data.

We build on Jazz because local-first architecture aligns with our values:

- **User sovereignty**: Data lives on the device, not our servers.

- **Offline capability**: Applications work without network connectivity. Users are not dependent on our infrastructure to access their own data.

- **Real-time sync**: Changes propagate instantly when connections exist. Collaboration happens naturally without complex server coordination. Multiple users editing the same document see each other's changes in real time.

- **Privacy by default**: Data is encrypted and user-controlled. We cannot access user data even if we wanted to. Privacy is not a feature; it is the foundation.

This is not just technical architecture; it is a stance on who should control information. We build tools that respect users.

Our patterns reflect this: Jazz writes are always followed by `waitForSync()` before reads because local-first means accepting that synchronization is asynchronous and potentially delayed. We embrace this complexity rather than hiding it. The user experience of instant local updates with eventual sync is worth the engineering discipline required to handle it correctly.

Local-first changes how you think about state. Every piece of data has a home - the user's device. Our servers facilitate connection, but they do not own the data. This is the future we want to build toward.

---

These beliefs manifest in our invariant checklist. Review it before every commit. It is the practical application of these principles to daily work. Each item on that list exists because violating it would undermine one of the core beliefs documented here. The checklist is your tool for turning philosophy into practice.
