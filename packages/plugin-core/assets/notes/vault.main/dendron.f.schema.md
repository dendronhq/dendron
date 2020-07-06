# Schemas

> NOTE: The functionality in this section is under active development and will be released shortly.

As you end up creating more notes, it can be hard to keep track of it all. This is why Dendron has **schemas** to help you manage your notes at scale. Think of schemas as an **optional type system** for your notes. They describe the hierarchy of your data and are themselves, represented as a hierarchy.

```yml
  # an id identifies a particular node in the schema
- id: cli 
  # human readable description of hierarchy
  desc: reference to cli programs
  # the root of the hiearchy has a parent of root
  parent: root
  # when a schema is a namespace, it can have arbitrary children
  namespace: true
```

Here is schema for the programming language hierarchy

```yml
- id: programming_language
  # an alias is the shorthand representation of a hiearchy
  alias: l
  parent: root
  namespace: true
  data.pattern: "^l"
  children:
- id: data
  alias: d
  desc: data structures
  children:
    - boolean
    - array
    - string
- id: io
  desc: input/output
- id: flow
  desc: control flow
- id: boolean
- id: array
- id: string
```

Note that schemas are entirely optional and usually something that you develop over time. To that end, Dendron has many capabilities to help you develop and evolve your schemas over time and the ability to automatically refactor your notes to match your schemas. 
