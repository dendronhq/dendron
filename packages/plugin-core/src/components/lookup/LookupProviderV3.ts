import { FuseEngine, NoteProps } from "@dendronhq/common-all";
import _ from "lodash";
import stringSimilarity from "string-similarity";

/** This function presumes that 'CreateNew' should be shown and determines whether
 *  CreateNew should be at the top of the look up results or not. */
export function shouldBubbleUpCreateNew({
  numberOfExactMatches,
  querystring,
  bubbleUpCreateNew,
}: {
  numberOfExactMatches: number;
  querystring: string;
  bubbleUpCreateNew?: boolean;
}) {
  // We don't want to bubble up create new if there is an exact match since
  // vast majority of times if there is an exact match user wants to navigate to it
  // rather than create a new file with exact same file name in different vault.
  const noExactMatches = numberOfExactMatches === 0;

  // Note: one of the special characters is space/' ' which for now we want to allow
  // users to make the files with ' ' in them but we won't bubble up the create new
  // option for the special characters, including space. The more contentious part
  // about previous/current behavior is that we allow creation of files with
  // characters like '$' which FuseJS will not match (Meaning '$' will NOT match 'hi$world').
  const noSpecialQueryChars =
    !FuseEngine.doesContainSpecialQueryChars(querystring);

  if (_.isUndefined(bubbleUpCreateNew)) bubbleUpCreateNew = true;

  return noSpecialQueryChars && noExactMatches && bubbleUpCreateNew;
}

/**
 * Sorts the given candidates notes by similarity to the query string in
 * descending order (the most similar come first) */
export function sortBySimilarity(candidates: NoteProps[], query: string) {
  return (
    candidates
      // To avoid duplicate similarity score calculation we will first map
      // to have the similarity score cached and then sort using cached value.
      .map((cand) => ({
        cand,
        similarityScore: stringSimilarity.compareTwoStrings(cand.fname, query),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .map((v) => v.cand)
  );
}
