# Setup

## Setup for publishing

- from workspace

```sh
mkdir build
# TODO: get secret from 1pass
echo {OVSX_SECRET} > OVSX_PAT
export OVSX_PAT=`cat OVSX_PAT`
git clone {dendron remote}

```

# Workflows

## Publishing a patch release

- [ ] integ tests
- [ ] `Pub: Local`
- [ ] Test locally
- [ ] Update docs
- [ ] `Code: Release`
- [ ] update changelog
- [ ] `./scripts/changelog.sh`
- [ ] announce on twitter and discord

## Publishing a minor release

- [ ] publish

```
lerna publish from-package --ignore-scripts -y
git push
```

- [ ] integ tests
- [ ] `Pub: Local`
- [ ] Test locally
- [ ] `Code: Release`
- [ ] announce on twitter and discord
