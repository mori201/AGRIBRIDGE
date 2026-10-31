import * as React from "react";

/** Rendu Markdown minimal et sûr (aucun HTML brut injecté). */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</strong>);
    else {
      const label = tok.slice(1, tok.indexOf("]"));
      const href = m[2];
      const ext = href.startsWith("http");
      out.push(
        <a key={`${keyBase}-${i++}`} href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
          {label}
        </a>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source, className }: { source?: string | null; className?: string }) {
  if (!source) return null;
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      const k = `p${blocks.length}`;
      blocks.push(<p key={k}>{inline(para.join(" "), k)}</p>);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const k = `l${blocks.length}`;
      const items = list.items.map((it, idx) => <li key={idx}>{inline(it, `${k}-${idx}`)}</li>);
      blocks.push(list.ordered ? <ol key={k}>{items}</ol> : <ul key={k}>{items}</ul>);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (line.startsWith("### ")) {
      flushPara(); flushList();
      blocks.push(<h3 key={`h${blocks.length}`}>{inline(line.slice(4), `h${blocks.length}`)}</h3>);
    } else if (line.startsWith("## ") || line.startsWith("# ")) {
      flushPara(); flushList();
      blocks.push(<h2 key={`h${blocks.length}`}>{inline(line.replace(/^#+\s/, ""), `h${blocks.length}`)}</h2>);
    } else if (line.startsWith("> ")) {
      flushPara(); flushList();
      blocks.push(<blockquote key={`q${blocks.length}`}>{inline(line.slice(2), `q${blocks.length}`)}</blockquote>);
    } else if (ul || ol) {
      flushPara();
      const ordered = Boolean(ol);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((ul ?? ol)![1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className={`prose-agri ${className ?? ""}`}>{blocks}</div>;
}
