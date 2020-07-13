# Schemas


As you end up creating more notes, it can be hard to keep track of it all. This is why Dendron has **schemas** to help you manage your notes at scale. Think of schemas as an **optional type system** for your notes. They describe the hierarchy of your data and are themselves, represented as a hierarchy.

Schemas show up as icons next to lookup results.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-closeup.jpg)

You can create a schema by adding a YAML file with the following naming scheme `{name}.schema.yml` to your workspace. 

Below is an example of a three-level hierarchy describing cli commands. You don't need to concern yourself with the details of the schema syntax just yet, just know that this schema will match the following [glob patterns](https://facelessuser.github.io/wcmatch/glob/): `cli.*`, `cli.*.cmd`, `cli.*.cmd.*`, `cli.*.env`

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

Stubs are notes that don't exist but will show up in lookup results. There are two reasons why these notes might show up: 
- they are the parent of a note deeper in the hierarchy (eg. `foo.bar` might be a stub for `foo.bar.foobar`)
- they are possible notes according to the schema

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-plus.jpg)
> The `+` sign next to the suggestion indicates that the note is a stub and does not exist 

# Unknown Schema

Dendron doesn't force you to use schemas if you don't want to. This is why you can create notes that don't match any schema. Dendron will show you a `?` next to these results.

![](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/schema-question.jpg)

> Sometimes ~~rules~~ schemas are meant to be broken


##  Next
Next, we're going to discuss additional capabilities you can do in Dendron under [[dendron.capabilities]]