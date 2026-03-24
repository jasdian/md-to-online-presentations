---
title: "Example Presentation"
subtitle: "A tour of the slide engine features"
author: "John Wick"
date: 2026-03-24
---

## Welcome

This is an example deck demonstrating the slide engine[^1].

- Lightweight: under 4 KB total JS+CSS
- Mobile-first: swipe to navigate
- Keyboard: arrows, Space, Home/End

[^1]: Built with pandoc and a custom template.

::: notes
Welcome the audience. Mention that this is a quick tour of all features including footnotes, speaker notes, and the new toolbar.
:::

---

## Navigation

| Key | Action |
|-----|--------|
| Arrow Right / Down / Space | Next slide |
| Arrow Left / Up | Previous slide |
| Home / End | First / Last |
| F | Fullscreen |
| O | Overview mode |
| N | Toggle notes |

::: notes
Walk through each shortcut. Highlight that N is new for the notes panel.
:::

---

## Code Example

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

for num in fibonacci(10):
    print(num)
```

---

## Two Columns

::: columns
::: column
### Left Side

- First point
- Second point
- Third point
:::

::: column
### Right Side

> Blockquotes work naturally within columns.

And so does regular text.
:::
:::

---

## Images

Images scale responsively:

![Placeholder](https://picsum.photos/800/400)

---

## Speaker Notes

This slide has hidden speaker notes.

::: notes
These notes are only visible in the HTML source.
They can be used for presenter reference.
:::

---

## Thank You

Print this deck: `Ctrl+P` or `Cmd+P`

The `@media print` styles handle page breaks automatically.
