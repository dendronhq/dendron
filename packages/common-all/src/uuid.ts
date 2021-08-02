import { customAlphabet as nanoid } from "nanoid";
import { customAlphabet as nanoidAsync } from "nanoid/async";
import { customAlphabet as nanoidInsecure } from "nanoid/non-secure";
import { alphanumeric } from "nanoid-dictionary";

/** Using this length, according to [nanoid collision calculator](https://zelark.github.io/nano-id-cc/),
 * generating 1000 IDs per hour, it would take around 919 years to have 1 percent chance of a single collision.
 * This is okay for the "insecure" generator, which is used in limited cases where collisions are less likely.
 */
const SHORT_ID_LENGTH = 12;
/** Default length for nanoids. */
const LONG_ID_LENGTH = 21;

/** Generates a random identifier.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUID = nanoid(alphanumeric, LONG_ID_LENGTH);

/** Generates a random identifier asynchronously.
 *
 * The entropy collection is performed asynchronously, allowing other code to run in the meantime.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUIDasync = nanoidAsync(alphanumeric, LONG_ID_LENGTH);

/** Generates a shorter random identifier, faster but with potential cryptographic risks.
 *
 * Uses an insecure random generator for faster generation.
 * Also shortens the length of the generated IDs to 16 characters.
 * This increases the risk of collisions.
 * Only use this if performance is important and collisions are relatively unimportant.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUIDInsecure = nanoidInsecure(alphanumeric, SHORT_ID_LENGTH);
