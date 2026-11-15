import type { ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; fill?: boolean; preload?: boolean };

/** Stands in for next/image in the static demo, where there is no image optimiser. */
export default function Image({ fill, preload, alt = "", style, ...rest }: Props) {
  const fillStyle = fill ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", objectFit: "cover" as const } : undefined;
  // eslint-disable-next-line @next/next/no-img-element -- this shim is the plain <img> replacement
  return <img alt={alt} loading={preload ? "eager" : "lazy"} decoding="async" style={{ ...fillStyle, ...style }} {...rest} />;
}
