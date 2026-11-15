import QRCode from "qrcode";
import { shopPalette } from "@/lib/colour";

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1C1A17", light: "#FFFFFF" } });
}

type Props = {
  name: string; emphasis: string | null; tagline: string | null; accentHex: string;
  url: string; displayLink: string; isDemo: boolean; id?: string;
};

/** Signature moment 6: a neat counter sign, the shop's signboard on top and a real QR code below. */
export async function CounterSign({ name, emphasis, tagline, accentHex, url, displayLink, isDemo, id }: Props) {
  const palette = shopPalette(accentHex);
  const svg = await qrSvg(url);
  const words = name.split(" ");
  const heavy = emphasis ?? words[words.length - 1];
  return (
    <div className="sign" id={id} style={{ "--sign-paint": palette.sign, "--sign-ink": palette.signInk } as React.CSSProperties}>
      <div className="sign__board">
        <div className="sign__name">{words.map((w, i) => <span key={i}>{i ? " " : ""}{w === heavy ? <b>{w}</b> : <span className="w-light">{w}</span>}</span>)}</div>
        {tagline && <p>{tagline}</p>}
      </div>
      <div className="sign__mid">
        <div className="sign__qr" role="img" aria-label={`QR code for ${displayLink}`} dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="sign__cta">Scan to see everything we sell.<br />Order on WhatsApp.</p>
      </div>
      <div className="sign__foot"><span>{displayLink}</span><span>{isDemo ? "DEMO" : "No app needed"}</span></div>
    </div>
  );
}
