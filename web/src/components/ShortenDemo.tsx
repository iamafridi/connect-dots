import { useId, useState, type FormEvent } from "react";
import { CopyButton } from "./Primitives";

const CODES = "abcdefghijklmnopqrstuvwxyz234567";
const demoCode = () =>
  Array.from({ length: 6 }, () => CODES[Math.floor(Math.random() * CODES.length)]).join("");

const demoShorten = (url: string) => {
  const parsed = url.match(/^https?:\/\//i) ? url : `http://${url}`;
  const code = demoCode();
  const shortUrl = `${window.location.origin}/${code}`;
  return new Promise<{ shortUrl: string; realURL: string }>((resolve) =>
    window.setTimeout(() => resolve({ shortUrl, realURL: parsed }), 420),
  );
};

export default function ShortenDemo() {
  // The demo is mounted more than once (Product hero + the #shorten section),
  // so the input id has to be unique per instance for the label to point at it.
  const inputId = `dest-url-${useId()}`;
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<{ shortUrl: string; realURL: string } | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || pending) return;
    setPending(true);
    setResult(null);
    try {
      const res = await demoShorten(url.trim());
      setResult(res);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="shortbox">
      <form onSubmit={onSubmit}>
        <div className="shortbox__field">
          <label className="shortbox__label" htmlFor={inputId}>
            Destination URL
          </label>
          <input
            id={inputId}
            className="shortbox__input"
            type="text"
            inputMode="url"
            placeholder="https://example.com/a-very-long-link"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setResult(null);
            }}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn btn--coral" disabled={pending}>
          {pending ? "Shortening…" : "Shorten it →"}
        </button>
      </form>

      <div className={`short-result${result ? " is-visible" : ""}`}>
        <span className="short-result__url">{result?.shortUrl}</span>
        <div className="short-result__meta">
          <span>302 redirect</span>
          <span>
            <i>&lt;</i>1ms
          </span>
          <span>0 views</span>
        </div>
        <CopyButton text={result?.shortUrl ?? ""} label="Copy" />
      </div>
    </div>
  );
}