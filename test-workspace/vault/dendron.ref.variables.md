---
id: M9rOflmkDfdDRoyyt9KHa
title: Variables
desc: 'This is a demo note on variable substitution'
updated: 1637047858096
created: 1636078412308
alist: ["one", "two", "three"]
stage: "🌱"
---

> this note is in it's {{ fm.stage }} stage
>
> Created: {{ fm.created }}
>
> Updated: {{ fm.updated }}

**{{ fm.desc }}**
## {{ fm.title }}

- {{ fm.alist[0] }}
- {{ fm.alist[1] }}
- {{ fm.alist[2] }}
