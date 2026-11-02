// Server-only: resamples an uploaded banner to the size it will be shown at
// (width x height already has the image's own proportions - see actions.js), at
// up to 2x for sharp screens. Nothing is padded, cropped or stretched.
import sharp from "sharp";
import { AD_ASPECT_TOLERANCE } from "@/lib/ads";

const MAX_SIDE = 2000;
const RETINA = 2;

// Returns { buffer, type, changed, width, height }. `changed` is false when
// the upload already had the right shape and a sensible resolution, in which
// case the original bytes are used untouched.
export async function fitBannerImage(input, type, width, height) {
  const meta = await sharp(input).metadata();
  const wanted = width / height;
  const actual = meta.width / meta.height;
  const sameShape = Math.abs(actual - wanted) / wanted <= AD_ASPECT_TOLERANCE;

  // Final pixel size: the display size at 2x, but never bigger than the source
  // needs when the shape matches (no pointless upscaling of a large image).
  let outWidth = Math.min(width * RETINA, MAX_SIDE);
  let outHeight = Math.round(outWidth / wanted);
  if (outHeight > MAX_SIDE) {
    outHeight = MAX_SIDE;
    outWidth = Math.round(outHeight * wanted);
  }
  if (sameShape && meta.width >= width && meta.width <= outWidth) {
    return { buffer: input, type, changed: false, width: meta.width, height: meta.height };
  }
  if (sameShape && meta.width < outWidth) {
    // Small but right-shaped: bring it up to the display size (not 2x).
    outWidth = width;
    outHeight = height;
  }

  const transparent = type !== "image/jpeg";
  let pipeline = sharp(input).rotate().resize(outWidth, outHeight, {
    fit: "fill",
    kernel: "lanczos3",
    background: transparent ? { r: 255, g: 255, b: 255, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 },
  });

  if (type === "image/png") pipeline = pipeline.png({ compressionLevel: 9 });
  else if (type === "image/webp") pipeline = pipeline.webp({ quality: 92 });
  else pipeline = pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 92, mozjpeg: true });

  const buffer = await pipeline.toBuffer();
  return { buffer, type, changed: true, width: outWidth, height: outHeight };
}
