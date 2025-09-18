export function buildUpstreamURL(
  baseURL: string,
  slugSegments: readonly string[] = [],
  searchParams?: URLSearchParams,
): string {
  const trimmedBase = baseURL.replace(/\/+$/, "");
  const encodedPath = slugSegments
    .flat()
    .filter((segment): segment is string => !!segment && segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  let url = encodedPath.length > 0 ? `${trimmedBase}/${encodedPath}` : trimmedBase;

  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    params.delete("slug");
    const paramsString = params.toString();
    if (paramsString.length > 0) {
      url += `?${paramsString}`;
    }
  }

  return url;
}
