import { customAlphabet as nanoid } from "nanoid";
import { customAlphabet as nanoidInsecure } from "nanoid/non-secure";

/** Using this length, according to [nanoid collision calculator](https://zelark.github.io/nano-id-cc/),
 * generating 1000 IDs per hour, it would take around 919 years to have 1 percent chance of a single collision.
 * This is okay for the "insecure" generator, which is used in limited cases where collisions are less likely.
 */
const SHORT_ID_LENGTH = 12;
/** Default length for nanoids. */
const LONG_ID_LENGTH = 23;

const alphanumericLowercase = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Generates a random identifier.
 *
 * Backward compatibility notes:
 * Previously this id has been generated differently including using
 * ------------------------------
 * * uuidv4(); from "uuid/v4";
 * * { v4 } from "uuid";
 * * nanoid(); from "nanoid";  uses: [A-Za-z0-9_-]
 * ------------------------------
 * Hence even though right now we only have alphanumeric ids, previously there
 * has been ids with `-` and `_` around, that still exist in our users notes.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUID = nanoid(alphanumericLowercase, LONG_ID_LENGTH);

/** Generates a shorter random identifier, faster but with potential cryptographic risks.
 *
 * Uses an insecure random generator for faster generation.
 * Also shortens the length of the generated IDs to 16 characters.
 * This increases the risk of collisions.
 * Only use this if performance is important and collisions are relatively unimportant.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUIDInsecure = nanoidInsecure(
  alphanumericLowercase,
  SHORT_ID_LENGTH
);
