---
id: nunjucks
title: Nunjucks
desc: ""
updated: 1614304717429
created: 1608518909864
alist: ["one", "two", "three"]
---

## Variables

- special variables: {{fname}}
- special variable as link: [[{{fname}}]]
<!-- - special variable as note ref: ![[{{fname}}#footer]] -->

## Loops

{% for item in fm.alist %}

- Item: {{item}}
  {% endfor %}

## Footer

This is some footer content
