import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 (gtag) qua `@next/third-parties/google`. Bật khi đặt `NEXT_PUBLIC_GA_MEASUREMENT_ID` (dạng `G-xxxxxxxxxx`).
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null;
  return <NextGoogleAnalytics gaId={GA_ID} />;
}
