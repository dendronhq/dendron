import { nanoid } from "nanoid";
import { nanoid as nanoidAsync } from "nanoid/async";
import { nanoid as nanoidInsecure } from "nanoid/non-secure";

/** Generates a random identifier.
 *
 * @param size If provided, the output will be this many characters. Mind that collisions are more likely with shorter sizes.
 * @returns A url-safe, random identifier.
 */
export function genUUID(size?: number) {
  return nanoid(size);
}

/** Generates a random identifier asynchronously.
 *
 * The entropy collection is performed asynchronously, allowing other code to run in the meantime.
 *
 * @param size If provided, the output will be this many characters. Mind that collisions are more likely with shorter sizes.
 * @returns A url-safe, random identifier.
 */
export function genUUIDasync(size?: number) {
  return nanoidAsync(size);
}

/** Generates a random identifier, faster but with potential cryptographic risks.
 *
 * Uses an insecure random generator for faster generation.
 * This increases the risk of collision attacks.
 * Only use this if performance is critical and collisions are relatively unimportant.
 *
 * @param size If provided, the output will be this many characters. Mind that collisions are more likely with shorter sizes.
 * @returns A url-safe, random identifier.
 */
export function genUUIDInsecure(size?: number) {
  return nanoidInsecure(size);
}
