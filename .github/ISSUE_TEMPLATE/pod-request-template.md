---
name: Pod Request Template
about: 'When requesting a Pod (import/export method for Dendron), use this template. '
title: "[Pod Request] placeholder"
labels: ''
assignees: kpathakota

---

# <template> Pod Proposal

## Import
<What does import look like? How will the data from the source get formatted when imported into Dendron?>

## Build
<What does build look like? What steps need to occur prior to exporting your Dendron notes>

## Export
<What does export look like?>

## Configuration
<What might a configuration file look like to help make sure your data is formatted correctly ?>

e.g.
destinations:
  - destination:
      base: People
      table: Interactions
    src:
      meet.{today}.*
    mapping:
      fm.created: DateV2
      fm.type: Type
      section.noes: Notes
      section.people: People



## Example Use Cases
<e.g. Sync notes from meetings with an airtable tracking meetings across days and people>
