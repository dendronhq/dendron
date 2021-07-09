import { customAlphabet as nanoid } from "nanoid";
import { customAlphabet as nanoidAsync } from "nanoid/async";
import { customAlphabet as nanoidInsecure } from "nanoid/non-secure";
import { alphanumeric } from "nanoid-dictionary";

/** Using this length, according to [nanoid collision calculator](https://zelark.github.io/nano-id-cc/),
 * generating 1000 IDs per second, it would take around 981 years to have 1 percent chance of a single collision.
 * This is actually a higher chance than UUID (and default of nanoid), but still very safe for our purposes.
 */
const ID_LENGTH = 16;

/** Generates a random identifier.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUID = nanoid(alphanumeric, ID_LENGTH);

/** Generates a random identifier asynchronously.
 *
 * The entropy collection is performed asynchronously, allowing other code to run in the meantime.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUIDasync = nanoidAsync(alphanumeric, ID_LENGTH);

/** Generates a random identifier, faster but with potential cryptographic risks.
 *
 * Uses an insecure random generator for faster generation.
 * This increases the risk of collision attacks.
 * Only use this if performance is critical and collisions are relatively unimportant.
 *
 * @returns A url-safe, random identifier.
 */
export const genUUIDInsecure = nanoidInsecure(alphanumeric, ID_LENGTH);
