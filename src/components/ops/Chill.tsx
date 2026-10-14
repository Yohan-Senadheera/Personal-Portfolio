import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { medium, socials, travel } from "@/content/fun";

function SectionHead({
  n,
  tag,
  title,
  lead,
}: {
  n: string;
  tag: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="ops-head rv">
      <span className="ops-bignum" aria-hidden="true">
        {n}
      </span>
      <div className="ops-eyebrow">
        {n} <b>/</b> {tag}
      </div>
      <h2 className="ops-h2">{title}</h2>
      {lead && <p className="ops-lead">{lead}</p>}
    </div>
  );
}

/* ---------------- writing (Medium) ---------------- */

export function Writing({ n }: { n: string }) {
  return (
    <section id="writing" className="ops-wrap ops-sec">
      <SectionHead
        n={n}
        tag="writing"
        title="I write about what I build"
        lead="Engineering logs on Medium, straight from the internship work."
      />
      <div className="ops-writing">
        {medium.articles.map((a, i) => (
          <div
            className="rv"
            key={a.url}
            style={{ transitionDelay: `${i * 0.06}s` }}
          >
            <a
              className="ops-article"
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="tg">{a.tag}</span>
              <b>{a.title}</b>
              <span className="bl">{a.blurb}</span>
              <span className="ft">
                <span>{a.date}</span>
                <span>read on Medium ↗</span>
              </span>
            </a>
          </div>
        ))}
      </div>
      <div className="ops-note">
        <a href={medium.profile} target="_blank" rel="noopener noreferrer">
          all posts on medium.com/@yohansenadheera ↗
        </a>
      </div>
    </section>
  );
}

/* ---------------- kubernetes secret game ---------------- */

type Line = { kind: "cmd" | "out" | "err" | "ok"; text: string };

const enc = (s: string) => {
  try {
    return window.btoa(s || "coming-soon");
  } catch {
    return "Y29taW5nLXNvb24=";
  }
};

const chips = [
  "kubectl get pods -n yohan",
  "kubectl logs socials -n yohan",
  "kubectl get secret socials -n yohan -o yaml",
  "kubectl get secret socials -o jsonpath='{.data}' | base64 -d",
];

export function SecretGame() {
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([
    {
      kind: "out",
      text: "mission: the socials pod is crashing. find out why and unlock my social links.",
    },
    { kind: "out", text: "type a command, tap a suggestion, or type 'help'." },
  ]);
  const [input, setInput] = useState("");
  const [sawSecret, setSawSecret] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const out = (...ls: Line[]) => setLines((x) => [...x, ...ls]);

  const unlock = (how: string) => {
    out(
      { kind: "ok", text: how },
      {
        kind: "ok",
        text: "pod/socials-7d9f4: CrashLoopBackOff → Running ✓  socials unlocked below",
      },
    );
    setUnlocked(true);
  };

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const c = cmd.toLowerCase().replace(/\s+/g, " ");
    out({ kind: "cmd", text: cmd });

    // any confession of feelings ends up on the same blocked page
    const feelings = [
      /\b(love|luv|lv|like|want|need|adore|miss|fancy|crush on|have a crush on)\s*(you|u|ya|yu|yohan)\b/,
      /\b(i|me)\s*(❤️?|♥️?|💕|💖|😍|<3)\s*(you|u)\b/,
      /^(i ?love ?you|ily|ilu|ilysm|love|luv|<3|❤️?|♥️?|💕|💖|😍|🥰|😘)$/,
      /\b(be mine|marry me|date me|kiss me|go out with me|be my (girlfriend|boyfriend|valentine|wife|husband))\b/,
    ];
    if (feelings.some((re) => re.test(c))) {
      out({ kind: "err", text: "checking RBAC for feelings.yaml ... redirecting" });
      window.setTimeout(() => navigate("/i-love-you"), 700);
      return;
    }
    if (c === "clear") {
      setLines([]);
      return;
    }
    if (c === "help") {
      out(
        {
          kind: "out",
          text: "the path: kubectl get pods → kubectl logs socials → kubectl get secret socials -o yaml → … | base64 -d",
        },
        {
          kind: "out",
          text: "also try: ls, whoami, kubectl get nodes, coffee, sudo. stuck? type 'give up'.",
        },
      );
      return;
    }
    if (/(hire|recruit)/.test(c)) {
      out(
        {
          kind: "ok",
          text: "permission granted. this is the best command anyone has typed today. 🎉",
        },
        {
          kind: "ok",
          text: "📬 yohansenadheera@gmail.com, or scroll down to Contact.",
        },
      );
      return;
    }
    if (c.startsWith("sudo")) {
      out({
        kind: "err",
        text: "visitor is not in the sudoers file. This incident will be reported. 🚨",
      });
      return;
    }
    if (/(give up|--force|cheat)/.test(c)) {
      unlock(
        "fine, applying with --force. (we never do this in production 👀)",
      );
      return;
    }
    if (c.includes("base64") && (c.includes("-d") || c.includes("--decode"))) {
      if (!sawSecret) {
        out({
          kind: "err",
          text: "decode what? fetch the secret first: kubectl get secret socials -n yohan -o yaml",
        });
        return;
      }
      unlock("decoded secret/socials: instagram, facebook, whatsapp, medium");
      return;
    }
    if (c.startsWith("kubectl get secret")) {
      if (!c.includes("socials")) {
        out({
          kind: "out",
          text: "NAME      TYPE     DATA   AGE\nsocials   Opaque   4      22y",
        });
        return;
      }
      setSawSecret(true);
      out({
        kind: "out",
        text: [
          "apiVersion: v1",
          "kind: Secret",
          "metadata:",
          "  name: socials",
          "  namespace: yohan",
          "type: Opaque",
          "data:",
          ...socials.map((s) => `  ${s.name.toLowerCase()}: ${enc(s.url)}`),
          "",
          "# base64 is encoding, not encryption. you know what to do.",
        ].join("\n"),
      });
      return;
    }
    if (c.startsWith("kubectl logs") || c.startsWith("kubectl describe")) {
      out({
        kind: "err",
        text: 'level=fatal msg="secret/socials is still base64 encoded; a human must decode it" hint="kubectl get secret socials -n yohan -o yaml"',
      });
      return;
    }
    if (c.startsWith("kubectl delete")) {
      out({
        kind: "err",
        text: "pod deleted. new pod... CrashLoopBackOff again. restarting never fixes config 😉",
      });
      return;
    }
    if (c.startsWith("kubectl get po")) {
      out({
        kind: "out",
        text: unlocked
          ? "NAME            READY   STATUS    RESTARTS\nsocials-7d9f4   1/1     Running   7"
          : "NAME            READY   STATUS             RESTARTS\nsocials-7d9f4   0/1     CrashLoopBackOff   7",
      });
      return;
    }

    // bad words get a polite, slightly cheeky reply
    const rude =
      /\b(f+u+c*k+\w*|fk|fck|wtf|stfu|sh[i1]t\w*|bullshit|crap|damn|bitch\w*|bastard|ass(hole)?|dick|piss\w*|suck(s)?|idiot|stupid|dumb|moron|loser|noob|hate you|pako|huththa|hutta|hutto|kari(ya)?|ponnaya|wesi\w*|baduwa)\b/;
    if (rude.test(c)) {
      const comebacks = [
        "whoa, language! this cluster enforces a PodSecurityPolicy for that. 🧼",
        "error: profanity is not a valid kubectl verb. try 'help'.",
        "kubectl apply -f manners.yaml ... deployment.apps/manners created ✓",
        "I'll pretend that was a typo. the pod is crashing, not you. 🙂",
        "403: my cluster's RBAC doesn't grant 'rude' to anyone. not even me.",
        "logged to /var/log/visitor-mood.log. take a breath, then try: kubectl get pods",
      ];
      out({ kind: "err", text: comebacks[Math.floor(Math.random() * comebacks.length)] });
      return;
    }

    // everything people are likely to try
    const replies: [RegExp, Line][] = [
      [
        /^(hi|hello|hey|yo|hii+)\b/,
        {
          kind: "out",
          text: "hey 👋 the socials pod is crashing. try: kubectl get pods -n yohan",
        },
      ],
      [
        /^(ls|ll|dir)\b/,
        {
          kind: "out",
          text: "cv.pdf  projects/  off-call/  secrets/  definitely-not-socials.yaml",
        },
      ],
      [/^pwd$/, { kind: "out", text: "/home/visitor/cluster/yohan" }],
      [/^whoami$/, { kind: "out", text: "visitor (a curious one, clearly)" }],
      [
        /^cd\b/,
        { kind: "out", text: "you're already exactly where the fun is." },
      ],
      [
        /^cat .*(socials|secret)/,
        {
          kind: "err",
          text: "nice try. secrets live in the cluster, not on disk: kubectl get secret socials -n yohan -o yaml",
        },
      ],
      [/^cat\b/, { kind: "out", text: "meow 🐈 (try kubectl instead)" }],
      [
        /^(rm|rm -rf)\b/,
        { kind: "err", text: "rm: permission denied. also, rude. 😤" },
      ],
      [
        /^(exit|quit|logout|:q!?|:wq)$/,
        {
          kind: "out",
          text: "you can check out any time you like, but you can never leave 🎸",
        },
      ],
      [
        /^(vim|vi|nano|emacs)\b/,
        {
          kind: "out",
          text: "opening an editor in a portfolio? bold. still no.",
        },
      ],
      [
        /^(history)$/,
        {
          kind: "out",
          text: "1  kubectl get pods\n2  coffee\n3  kubectl get pods\n4  more coffee",
        },
      ],
      [/^(date)$/, { kind: "out", text: new Date().toString() }],
      [
        /^(uname|uname -a)$/,
        { kind: "out", text: "YohanOS 2026.10 sre-x86_64 (powered by coffee)" },
      ],
      [
        /^(ping|curl|wget)\b/,
        {
          kind: "out",
          text: "64 bytes from yohan: icmp_seq=1 ttl=64 time=0.42 ms. he's up. ✓",
        },
      ],
      [
        /^echo\b/,
        {
          kind: "out",
          text: cmd.replace(/^echo\s*/i, "").replace(/^['"]|['"]$/g, "") || " ",
        },
      ],
      [
        /^(git)\b/,
        {
          kind: "out",
          text: "fatal: not a git repository. but github.com/Yohan-Senadheera is ↗",
        },
      ],
      [
        /^(docker)\b/,
        {
          kind: "out",
          text: "this cluster runs containerd. docker is so 2019 🐳",
        },
      ],
      [
        /^(helm)\b/,
        {
          kind: "out",
          text: "helm is great, but the problem here is a secret, not a chart.",
        },
      ],
      [
        /^(terraform)\b/,
        {
          kind: "out",
          text: "terraform plan: 0 to add, 0 to change, 1 secret to decode.",
        },
      ],
      [
        /^kubectl get (ns|namespaces?)\b/,
        {
          kind: "out",
          text: "NAME          STATUS   AGE\ndefault       Active   22y\nyohan         Active   22y\nlove          Forbidden  ?",
        },
      ],
      [
        /^kubectl get (nodes?|no)\b/,
        {
          kind: "out",
          text: "NAME              STATUS   ROLES           VERSION\nyohans-laptop     Ready    control-plane   v1.31\ncoffee-machine    Ready    worker          v∞",
        },
      ],
      [
        /^kubectl get (all|deploy|deployments?)\b/,
        {
          kind: "out",
          text: "deployment.apps/socials   0/1   1   0   CrashLoopBackOff\nsecret/socials            Opaque   4 keys",
        },
      ],
      [
        /^kubectl (version|cluster-info)\b/,
        { kind: "out", text: "Client: v1.31  Server: v1.31  Mood: optimistic" },
      ],
      [
        /^kubectl (apply|create|edit|patch)\b/,
        {
          kind: "err",
          text: "error: the manifest is fine. the secret just needs a human to decode it.",
        },
      ],
      [
        /^kubectl (exec|attach|port-forward)\b/,
        {
          kind: "err",
          text: "error: container is not running (CrashLoopBackOff). fix the secret first.",
        },
      ],
      [
        /^kubectl (rollout|scale)\b/,
        {
          kind: "err",
          text: "scaled to 3 replicas. now 3 pods are crashing instead of 1. 🙃",
        },
      ],
      [
        /^kubectl$/,
        {
          kind: "out",
          text: "kubectl controls the Kubernetes cluster manager. try: kubectl get pods -n yohan",
        },
      ],
      [
        /^base64\b/,
        {
          kind: "out",
          text: "close! you need to decode (-d), and you need something to decode first.",
        },
      ],
      [
        /(hire|job|recruit)/,
        {
          kind: "ok",
          text: "now we're talking. 📬 yohansenadheera@gmail.com, or scroll to Contact.",
        },
      ],
      [
        /(coffee|tea)/,
        {
          kind: "out",
          text: "☕ brewing... done. the pod is still crashing though.",
        },
      ],
      [
        /(beer|party)/,
        {
          kind: "out",
          text: "🍻 after the incident is resolved. rules are rules.",
        },
      ],
      [
        /^(42)$/,
        { kind: "out", text: "the answer, yes. but what was the question?" },
      ],
      [
        /^(man|info)\b/,
        { kind: "out", text: "no manual needed. type 'help'." },
      ],
      [
        /(password|passwd|admin|root)/,
        { kind: "err", text: "nice try 🕵️ no passwords here, only base64." },
      ],
      [
        /(matrix|neo)/,
        {
          kind: "ok",
          text: "wake up, visitor... follow the white rabbit: kubectl logs socials -n yohan 🐇",
        },
      ],
    ];
    for (const [re, line] of replies) {
      if (re.test(c)) {
        out(line);
        return;
      }
    }
    out({
      kind: "err",
      text: `command not found: ${cmd.split(" ")[0]}. type 'help' for ideas`,
    });
  };

  return (
    <div id="secret" className="ops-embed">
      <div className="ops-sub rv">side quest</div>
      <h3 className="ops-embed-h rv">Unlock my socials</h3>
      <p className="ops-embed-p rv">
        My social links are locked in a Kubernetes secret. Fix the crashing pod
        to get them.
      </p>
      <div className="ops-game rv">
        <div className="ops-term">
          <div className="ops-term-h">
            <i />
            <i />
            <i />
            <span>visitor@cluster: ~</span>
            <span className={`ops-game-st ${unlocked ? "ok" : "bad"}`}>
              {unlocked ? "● Running" : "● CrashLoopBackOff"}
            </span>
          </div>
          <div className="ops-game-b" ref={bodyRef} aria-live="polite">
            {lines.map((l, i) => (
              <pre key={i} className={l.kind}>
                {l.kind === "cmd" ? `$ ${l.text}` : l.text}
              </pre>
            ))}
          </div>
          <form
            className="ops-game-in"
            onSubmit={(e) => {
              e.preventDefault();
              run(input);
              setInput("");
            }}
          >
            <span>$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type a command…"
              aria-label="Command"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit">run ⏎</button>
          </form>
        </div>
        <div className="ops-game-side">
          <div className="ops-eyebrow" style={{ marginBottom: 8 }}>
            suggestions
          </div>
          <div className="ops-chips">
            {chips.map((c) => (
              <button key={c} onClick={() => run(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className={`ops-socials ${unlocked ? "open" : ""}`}>
            {socials.map((s) =>
              unlocked && s.url ? (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ops-social"
                >
                  <span aria-hidden="true">{s.icon}</span> {s.name} ↗
                </a>
              ) : (
                <div key={s.name} className="ops-social locked">
                  <span aria-hidden="true">{unlocked ? s.icon : "🔒"}</span>{" "}
                  {s.name}
                  {unlocked && !s.url ? " · soon" : ""}
                </div>
              ),
            )}
          </div>
          <div className="ops-note">psst… there are hidden commands too</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- travel journey ---------------- */

export function Travel() {
  const [i, setI] = useState(0);
  const trips = travel.filter((t) => t.media.length > 0);
  if (trips.length === 0) return null;
  const t = trips[Math.min(i, trips.length - 1)];
  return (
    <div id="travel" className="ops-embed">
      <div className="ops-sub rv">travel log</div>
      <h3 className="ops-embed-h rv">Places I've been</h3>
      <p className="ops-embed-p rv">
        Small stories from the road. Pick a stop on the route.
      </p>
      <div className="ops-route rv" role="tablist" aria-label="Trips">
        {trips.map((tr, k) => (
          <button
            key={tr.place + k}
            role="tab"
            aria-selected={k === i}
            className={k === i ? "on" : ""}
            onClick={() => setI(k)}
          >
            <span className="pin" aria-hidden="true" />
            <b>{tr.place}</b>
            <small>{tr.date}</small>
          </button>
        ))}
      </div>
      <div className="ops-trip ops-card rv" key={t.place}>
        <div className="ops-trip-media">
          {t.media.map((m) =>
            m.type === "video" ? (
              <figure key={m.src}>
                <video src={m.src} controls preload="metadata" playsInline />
                {m.caption && <figcaption>{m.caption}</figcaption>}
              </figure>
            ) : (
              <figure key={m.src}>
                <img src={m.src} alt={m.caption ?? t.place} loading="lazy" />
                {m.caption && <figcaption>{m.caption}</figcaption>}
              </figure>
            ),
          )}
        </div>
        <div className="ops-trip-story">
          <div className="ops-eyebrow">{t.date}</div>
          <h3>{t.place}</h3>
          <p>{t.story}</p>
        </div>
      </div>
    </div>
  );
}
