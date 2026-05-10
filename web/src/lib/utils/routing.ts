/**
 * Checks if a path is valid and not external to the app.
 *
 * Note: this method does not verify if the path exists or is accessible.
 */
export function isValidPath(path: string) {
  const VALID_PATH_REGEX =
    /^\/(?!\/)(?!.*\\)(?:[^\/?#\s]+(?:\/[^\/?#\s]+)*)?\/?(?:\?[^#\s]*)?(?:#[^\s]*)?$/;
  return VALID_PATH_REGEX.test(path.trim());
}
