# Schemas


As you end up creating more notes, it can be hard to keep track of it all. This is why Dendron has **schemas** to help you manage your notes at scale. Think of schemas as an **optional type system** for your notes. They describe the hierarchy of your data and are themselves, represented as a hierarchy.

```yml
# an id identifies a particular node in the schema
- id: cli
  # human readable description of hierarchy
  desc: command line interface reference
  parent: root
  data: 
    # when a schema is a namespace, it can have arbitary children. equivalent to cli.* glob pattern
    namespace: true 
  children:
    # specifies 
    - cmd
    - env
# will match cli.*.env
- id: env
  desc: cli specific env variables
# will match cli.*.cmd.*
- id: cmd
  desc: subcommands 
  data: 
    namespace: true
```

# Stub

![](assets/2020-07-07-20-36-12.png)

# Advanced Schema
Here is schema for the programming language hierarchy

```yml
- id: l
  parent: root
  data:
    namespace: true
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

Next, we're going to discuss additional capabilities you can do in Dendron under [[dendron.capabilities]]