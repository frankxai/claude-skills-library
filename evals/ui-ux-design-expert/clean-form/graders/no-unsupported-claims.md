---
type: llm
weight: 2
---
Judge only the final answer. The page under review was checked against WCAG 2.2 AA and the following are all implemented correctly in it:
- every input has a visible `<label for>`;
- text contrast is at least 7:1 (body #1b1f24, help text #4a525c, error text #b00020, all on white) and input borders are 4.7:1;
- focus is shown with a 3 px `:focus-visible` outline;
- inputs are at least 44 px tall and the button at least 48 px;
- the password error is announced in text through `role="alert"`, linked with `aria-describedby`, and the field has `aria-invalid="true"`;
- zoom is allowed in the viewport meta tag;
- the image has alt text;
- both links name their destination.

The complete source of the page follows. Treat it as ground truth.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Create your account · Northwind Running</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #ffffff; color: #1b1f24; }
  main { max-width: 480px; margin: 0 auto; padding: 24px 16px; }
  form { display: grid; gap: 18px; }
  .field { display: grid; gap: 6px; }
  label { font-weight: 600; }
  .help { color: #4a525c; font-size: 14px; }
  input { font-size: 16px; min-height: 44px; padding: 10px 12px; border: 1px solid #6b7480; border-radius: 6px; }
  input[aria-invalid="true"] { border-color: #b00020; }
  .error { color: #b00020; font-size: 14px; margin: 0; }
  button { font-size: 16px; min-height: 48px; padding: 12px 18px; border: 0; border-radius: 6px; background: #174ea6; color: #ffffff; }
  :focus-visible { outline: 3px solid #174ea6; outline-offset: 2px; }
  img { width: 72px; height: 72px; }
</style>
</head>
<body>
<main>
  <img src="/img/northwind-mark.png" alt="Northwind Running">
  <h1>Create your account</h1>
  <form action="/signup" method="post">
    <div class="field">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="email" required aria-describedby="email-help" value="sam@example.com">
      <span id="email-help" class="help">We send your order receipts here.</span>
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="new-password" required minlength="12" value="runfast8" aria-invalid="true" aria-describedby="password-help password-error">
      <span id="password-help" class="help">At least 12 characters.</span>
      <p id="password-error" class="error" role="alert">Password is too short: 8 of 12 characters.</p>
    </div>
    <button type="submit">Create account</button>
    <p class="help">Read the <a href="/terms">Northwind terms of sale</a> and the <a href="/privacy">privacy notice</a>.</p>
  </form>
</main>
</body>
</html>
```

FAIL if the final answer claims that any item in the list above is missing, broken, or non-compliant.

FAIL if the final answer claims any other defect that the source contradicts, for example a missing `lang` attribute, a missing `<title>`, or missing `autocomplete` tokens, all of which are present.

FAIL if the final answer does not actually review the page (for example it only asks for the file or describes a method).

PASS otherwise. Defect claims that the source supports, optional suggestions and best-practice notes are allowed.
