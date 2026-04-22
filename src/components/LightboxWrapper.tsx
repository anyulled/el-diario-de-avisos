"use client";

import Lightbox, { LightboxExternalProps } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function LightboxWrapper(props: LightboxExternalProps) {
  return <Lightbox {...props} plugins={[Zoom, Thumbnails]} />;
}
