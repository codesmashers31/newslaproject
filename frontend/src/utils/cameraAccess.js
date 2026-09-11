// videoConstraints would override camera selection, including the fallback.
export async function startCompatibleCamera(scanner, config, onScan) {
  try {
    await scanner.start({ facingMode: 'environment' }, config, onScan, () => {});
  } catch (error) {
    if (/NotAllowed|PermissionDenied|SecurityError/i.test(`${error?.name} ${error}`)) throw error;
    await scanner.start({ facingMode: 'user' }, config, onScan, () => {});
  }
}

export function cameraErrorMessage(error) {
  const detail = `${error?.name || ''} ${error?.message || error || ''}`;
  if (/InsecureContext/.test(detail)) return 'Camera scanning needs HTTPS. Open the secure website on your phone; an HTTP local-network address cannot use the camera.';
  if (/UnsupportedCamera/.test(detail)) return 'This browser cannot access the camera. Open the site directly in Chrome or Safari instead of an in-app browser.';
  if (/NotAllowed|PermissionDenied|SecurityError/i.test(detail)) return 'Camera access is blocked. Allow Camera for this site and for your browser in phone settings, then retry. If this is an embedded page, open it directly in Chrome or Safari.';
  if (/NotFound|DevicesNotFound/i.test(detail)) return 'No camera was found. Check that a camera is connected and enabled, then retry.';
  if (/NotReadable|TrackStart|AbortError|Could not start video/i.test(detail)) return 'The camera could not open. Close other apps or tabs using it, check your phone camera privacy switch, then retry.';
  if (/Overconstrained|ConstraintNotSatisfied/i.test(detail)) return 'This camera does not support the requested settings. Retry with another camera or browser.';
  return 'The camera could not start. Close other camera apps, then retry. You can also reopen this page in Chrome or Safari.';
}
