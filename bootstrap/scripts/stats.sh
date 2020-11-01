commit=$(git rev-list HEAD --max-count=1) 
cloc --vcs=git . | tee reports/$commit