
# Pull Request Checklist

You can go to [dendron pull requests](https://wiki.dendron.so/notes/adc39825-77a6-46cf-9c49-2642fcb4248e.html) to see full details for items in this checklist.

## General

### Quality Assurance
- [ ] add a [test](https://wiki.dendron.so/notes/cb22bd36-d45a-4ffd-a31e-96c4b39cb7fb.html#writing-tests) for the new feature
- [ ] make sure all the existing [tests](https://wiki.dendron.so/notes/cb22bd36-d45a-4ffd-a31e-96c4b39cb7fb.html#running-all-tests) pass
- [ ] do a spot check by running your feature with our [test workspace](https://wiki.dendron.so/notes/cb22bd36-d45a-4ffd-a31e-96c4b39cb7fb.html#test-workspace)
- [ ] after you submit your pull request, check the output of our [integration test](https://github.com/dendronhq/dendron/actions) and make sure all tests pass
  - NOTE: if you running MacOS or Linux, pay special attention to the Windows output and vice versa if you are developing on Windows

#### Special Cases
- [ ] if your tests changes an existing snapshot, make sure that snapshots are [updated](https://wiki.dendron.so/notes/cb22bd36-d45a-4ffd-a31e-96c4b39cb7fb.html#updating-test-snapshots)
- [ ] if you are adding a new language feature (graphically visible in VS Code/preview/publishing), make sure that it is included in [test-workspace](https://wiki.dendron.so/notes/cb22bd36-d45a-4ffd-a31e-96c4b39cb7fb.html#test-workspace). We use this to manually inspect new changes and for auto regression testing

### Docs
- [ ] Make sure that the PR title follows our [commit style](https://wiki.dendron.so/notes/adc39825-77a6-46cf-9c49-2642fcb4248e.html#commit-style)
- [ ] Please summarize the feature or impact in 1-2 lines in the PR description
- [ ] If your change reflects documentation changes, also submit a PR to [dendron-site](https://github.com/dendronhq/dendron-site) and mention the doc PR link in your current PR

Example PR Description
```markdown
# feat: capitalize all foos

This changes capitalizes all occurrences of `foo` to `Foo`

Docs PR: <URL_TO_DOCS_PR>
```

## Special Cases

### First Time PR
- [ ] sign the [CLA](https://en.wikipedia.org/wiki/Contributor_License_Agreement) which will be prompted by our github bot after you submit the PR
- [ ] add your [discord](https://discord.gg/AE3NRw9) alias in the review so that we can give you the [horticulturalist](https://wiki.dendron.so/notes/7c00d606-7b75-4d28-b563-d75f33f8e0d7.html#horticulturalist) badge in our community



### Analytics
- [ ] if you are adding analytics related changes, make sure the [Telemetry](https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html) docs are updated
