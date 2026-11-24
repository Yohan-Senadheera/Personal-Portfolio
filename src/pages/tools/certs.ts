import "reflect-metadata";
import * as x509 from "@peculiar/x509";

export type Level = "critical" | "warn" | "info" | "ok";
export type Issue = { level: Level; text: string };

export type CertInfo = {
  index: number; // position in the paste
  kind: "cert" | "csr";
  pem: string;
  subject: string;
  cn: string;
  issuer: string;
  issuerCn: string;
  serial: string;
  notBefore?: Date;
  notAfter?: Date;
  daysLeft?: number;
  key: string;
  keyWeak: boolean;
  sig: string;
  sigSha1: boolean;
  sans: string[];
  isCA: boolean;
  pathLen?: number;
  keyUsage: string[];
  eku: string[];
  selfSigned: boolean;
  fingerprint: string;
  role: "leaf" | "intermediate" | "root" | "csr" | "unrelated";
  issues: Issue[];
  raw?: x509.X509Certificate;
};

export type Report = {
  certs: CertInfo[];
  chain: CertInfo[]; // in the correct order, leaf first
  issues: Issue[];
  fixedBundle: string;
  privateKey: boolean;
  hostname?: { name: string; ok: boolean };
};

const EKU: Record<string, string> = {
  "1.3.6.1.5.5.7.3.1": "serverAuth",
  "1.3.6.1.5.5.7.3.2": "clientAuth",
  "1.3.6.1.5.5.7.3.3": "codeSigning",
  "1.3.6.1.5.5.7.3.4": "emailProtection",
  "1.3.6.1.5.5.7.3.8": "timeStamping",
  "1.3.6.1.5.5.7.3.9": "OCSPSigning",
};

const KU: [number, string][] = [
  [x509.KeyUsageFlags.digitalSignature, "digitalSignature"],
  [x509.KeyUsageFlags.nonRepudiation, "nonRepudiation"],
  [x509.KeyUsageFlags.keyEncipherment, "keyEncipherment"],
  [x509.KeyUsageFlags.dataEncipherment, "dataEncipherment"],
  [x509.KeyUsageFlags.keyAgreement, "keyAgreement"],
  [x509.KeyUsageFlags.keyCertSign, "keyCertSign"],
  [x509.KeyUsageFlags.cRLSign, "cRLSign"],
];

const cnOf = (dn: string) => dn.match(/(?:^|,\s*)CN=((?:\\,|[^,])+)/)?.[1]?.replace(/\\,/g, ",") ?? dn;

function keyDesc(alg: Algorithm & { modulusLength?: number; namedCurve?: string }): [string, boolean] {
  if (alg.modulusLength) return [`RSA ${alg.modulusLength}`, alg.modulusLength < 2048];
  if (alg.namedCurve) return [`EC ${alg.namedCurve}`, false];
  return [alg.name, false];
}

function sigDesc(alg: Algorithm & { hash?: Algorithm }): [string, boolean] {
  const hash = alg.hash?.name;
  const base = /RSASSA-PKCS1/.test(alg.name) ? "RSA" : alg.name;
  return [hash ? `${base} with ${hash}` : base, hash === "SHA-1"];
}

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(":");

export function pemBlocks(text: string) {
  const blocks = [...text.matchAll(/-----BEGIN ((?:NEW )?CERTIFICATE(?: REQUEST)?)-----[\s\S]+?-----END \1-----/g)].map((m) => ({
    type: m[1].includes("REQUEST") ? ("csr" as const) : ("cert" as const),
    pem: m[0].replace(/\r/g, ""),
  }));
  return { blocks, privateKey: /-----BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(text) };
}

/** DER file -> PEM text (for uploads). */
export function derToPem(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin).replace(/.{64}/g, "$&\n");
  return `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`;
}

function hostMatches(host: string, sans: string[], cn: string): boolean {
  const h = host.trim().toLowerCase().replace(/\.$/, "");
  const names = sans.length ? sans : [`dns:${cn}`];
  return names.some((n) => {
    const [type, v] = [n.slice(0, n.indexOf(":")), n.slice(n.indexOf(":") + 1).toLowerCase()];
    if (type === "ip") return v === h;
    if (type !== "dns") return false;
    if (v === h) return true;
    if (v.startsWith("*.")) {
      const rest = v.slice(2);
      const dot = h.indexOf(".");
      return dot > 0 && h.slice(dot + 1) === rest;
    }
    return false;
  });
}

async function readCert(pem: string, index: number): Promise<CertInfo> {
  const c = new x509.X509Certificate(pem);
  const now = Date.now();
  const sanExt = c.getExtension(x509.SubjectAlternativeNameExtension);
  const bc = c.getExtension(x509.BasicConstraintsExtension);
  const ku = c.getExtension(x509.KeyUsagesExtension);
  const eku = c.getExtension(x509.ExtendedKeyUsageExtension);
  let key = "unknown";
  let keyWeak = false;
  try {
    [key, keyWeak] = keyDesc(c.publicKey.algorithm as never);
  } catch {
    /* unsupported key type */
  }
  const [sig, sigSha1] = sigDesc(c.signatureAlgorithm as never);
  let selfSigned = c.subject === c.issuer;
  try {
    selfSigned = await c.isSelfSigned();
  } catch {
    /* keep the name-based guess */
  }
  return {
    index,
    kind: "cert",
    pem,
    subject: c.subject,
    cn: cnOf(c.subject),
    issuer: c.issuer,
    issuerCn: cnOf(c.issuer),
    serial: c.serialNumber.toUpperCase(),
    notBefore: c.notBefore,
    notAfter: c.notAfter,
    daysLeft: Math.floor((c.notAfter.getTime() - now) / 86400000),
    key,
    keyWeak,
    sig,
    sigSha1,
    sans: sanExt ? sanExt.names.items.map((n) => `${n.type}:${n.value}`) : [],
    isCA: !!bc?.ca,
    pathLen: bc?.pathLength,
    keyUsage: ku ? KU.filter(([f]) => (ku.usages & f) === f).map(([, n]) => n) : [],
    eku: eku ? eku.usages.map((u) => EKU[String(u)] ?? String(u)) : [],
    selfSigned,
    fingerprint: hex(await c.getThumbprint("SHA-256")),
    role: "unrelated",
    issues: [],
    raw: c,
  };
}

async function readCsr(pem: string, index: number): Promise<CertInfo> {
  const r = new x509.Pkcs10CertificateRequest(pem);
  const sanExt = r.extensions.find((e): e is x509.SubjectAlternativeNameExtension => e instanceof x509.SubjectAlternativeNameExtension);
  let key = "unknown";
  let keyWeak = false;
  try {
    [key, keyWeak] = keyDesc(r.publicKey.algorithm as never);
  } catch {
    /* unsupported key type */
  }
  const [sig, sigSha1] = sigDesc(r.signatureAlgorithm as never);
  let valid = true;
  try {
    valid = await r.verify();
  } catch {
    /* cannot verify in this browser */
  }
  const sans = sanExt ? sanExt.names.items.map((n) => `${n.type}:${n.value}`) : [];
  const issues: Issue[] = [];
  if (!valid) issues.push({ level: "critical", text: "The CSR signature does not verify: it was changed after it was signed, or it is corrupt." });
  if (!sans.length) issues.push({ level: "warn", text: "No subjectAltName. Browsers ignore the CN, so a CA-signed certificate from this CSR may not match any hostname." });
  if (keyWeak) issues.push({ level: "critical", text: `${key} is too small. Use RSA 2048+ or EC P-256.` });
  return {
    index,
    kind: "csr",
    pem,
    subject: r.subject,
    cn: cnOf(r.subject),
    issuer: "",
    issuerCn: "",
    serial: "",
    key,
    keyWeak,
    sig,
    sigSha1,
    sans,
    isCA: false,
    keyUsage: [],
    eku: [],
    selfSigned: false,
    fingerprint: hex(await crypto.subtle.digest("SHA-256", r.rawData)),
    role: "csr",
    issues,
  };
}

async function signedBy(child: CertInfo, parent: CertInfo): Promise<boolean> {
  if (!child.raw || !parent.raw) return false;
  try {
    return await child.raw.verify({ publicKey: parent.raw.publicKey, signatureOnly: true });
  } catch {
    return child.issuer === parent.subject; // fall back to names if the algorithm is not supported here
  }
}

export async function inspect(text: string, hostname?: string): Promise<Report> {
  const { blocks, privateKey } = pemBlocks(text);
  const all: CertInfo[] = [];
  const issues: Issue[] = [];
  for (const [i, b] of blocks.entries()) {
    try {
      all.push(b.type === "csr" ? await readCsr(b.pem, i) : await readCert(b.pem, i));
    } catch (e) {
      issues.push({ level: "critical", text: `Block ${i + 1} could not be parsed (${(e as Error).message}). Check it was copied completely.` });
    }
  }
  if (privateKey)
    issues.unshift({
      level: "critical",
      text: "You pasted a PRIVATE KEY. It was ignored and never left this page, but treat it as exposed if it was ever pasted anywhere online, and never share it.",
    });

  const certs = all.filter((c) => c.kind === "cert");

  // build the chain from the leaf upwards
  const issuerOf = new Map<CertInfo, CertInfo>();
  for (const c of certs) {
    if (c.selfSigned) continue;
    const cands = certs.filter((p) => p !== c && p.subject === c.issuer);
    for (const p of cands.length ? cands : certs.filter((p) => p !== c && p.isCA)) {
      if (await signedBy(c, p)) {
        issuerOf.set(c, p);
        break;
      }
    }
    if (!issuerOf.has(c) && cands.length)
      c.issues.push({
        level: "critical",
        text: `"${cands[0].cn}" has the right name to be the issuer, but its key did not sign this certificate. It is probably an older or renewed version of that CA; use the matching intermediate.`,
      });
  }
  const isIssuer = new Set(issuerOf.values());
  const leaves = certs.filter((c) => !isIssuer.has(c));
  const leaf = leaves.find((c) => !c.isCA) ?? leaves[0];
  const chain: CertInfo[] = [];
  for (let c: CertInfo | undefined = leaf; c && !chain.includes(c); c = issuerOf.get(c)) chain.push(c);

  chain.forEach((c, i) => {
    c.role = i === 0 ? (chain.length === 1 && c.selfSigned && c.isCA ? "root" : "leaf") : c.selfSigned ? "root" : "intermediate";
  });

  // per-certificate checks
  for (const c of certs) {
    const now = new Date();
    if (c.notBefore && c.notBefore > now) c.issues.push({ level: "critical", text: `Not valid yet: starts ${c.notBefore.toUTCString()}. Check the clock on the machine that issued it.` });
    if (c.daysLeft !== undefined) {
      if (c.daysLeft < 0) c.issues.push({ level: "critical", text: `Expired ${-c.daysLeft} day(s) ago.` });
      else if (c.daysLeft < 7) c.issues.push({ level: "critical", text: `Expires in ${c.daysLeft} day(s). Renew now.` });
      else if (c.daysLeft < 30) c.issues.push({ level: "warn", text: `Expires in ${c.daysLeft} days. Renew soon, and automate renewal (cert-manager, ACME, or a pipeline).` });
    }
    if (c.keyWeak) c.issues.push({ level: "critical", text: `${c.key} is too weak. Use RSA 2048 or larger, or EC P-256.` });
    if (c.sigSha1 && !c.selfSigned) c.issues.push({ level: "warn", text: "Signed with SHA-1, which modern clients reject. Reissue with SHA-256." });
    if (c.role === "leaf") {
      if (!c.sans.length) c.issues.push({ level: "warn", text: "No subjectAltName. Browsers and most TLS clients ignore the CN, so hostname checks will fail." });
      if (c.eku.length && !c.eku.includes("serverAuth") && !c.isCA) c.issues.push({ level: "info", text: `Extended key usage is ${c.eku.join(", ")} without serverAuth, so it cannot be used as a TLS server certificate.` });
      if (c.notBefore && c.notAfter && (c.notAfter.getTime() - c.notBefore.getTime()) / 86400000 > 398 && !c.selfSigned)
        c.issues.push({ level: "info", text: "Valid for more than 398 days. Fine for a private CA, but public browsers reject such long-lived certificates from public CAs." });
    }
    if (c.role === "intermediate" && !c.isCA) c.issues.push({ level: "critical", text: "Used as an issuer, but it is not marked as a CA (basicConstraints CA:TRUE). Clients will reject the chain." });
  }

  // chain-level checks
  if (certs.length) {
    const inputOrder = certs.map((c) => c.index);
    const chainIdx = chain.map((c) => c.index);
    const prefixMatches = chainIdx.every((v, i) => inputOrder[i] === v);
    if (!prefixMatches)
      issues.push({ level: "warn", text: "The certificates are in the wrong order. A server must send the leaf first, then each issuer in turn. The fixed bundle below has the right order." });
    const top = chain[chain.length - 1];
    if (top && !top.selfSigned) {
      const looksRoot = /root/i.test(top.issuerCn);
      issues.push(
        looksRoot
          ? { level: "info", text: `The chain ends at "${top.cn}", issued by "${top.issuerCn}", which looks like a root CA. Roots come from the client's trust store, so leaving it out is correct.` }
          : {
              level: "warn",
              text: `The chain ends at "${top.cn}", issued by "${top.issuerCn}", which is not in the paste. If "${top.issuerCn}" is an intermediate CA, the server must send it too, or clients like curl, Java and Android fail with "unable to get local issuer certificate".`,
            },
      );
    }
    if (top && top.selfSigned && chain.length > 1)
      issues.push({ level: "info", text: `The root "${top.cn}" is included. That is harmless but unnecessary in a server bundle: clients use their own trusted copy.` });
    const unrelated = certs.filter((c) => !chain.includes(c));
    unrelated.forEach((c) => (c.role = "unrelated"));
    if (unrelated.length)
      issues.push({ level: "warn", text: `${unrelated.length} certificate(s) are not part of this chain: ${unrelated.map((c) => `"${c.cn}"`).join(", ")}. Remove them from the bundle.` });
    if (!issues.some((i) => i.level !== "info") && !certs.some((c) => c.issues.some((i) => i.level !== "info")))
      issues.push({ level: "ok", text: chain.length > 1 ? "The chain is complete, in the right order, and every signature checks out." : "The certificate parsed cleanly with no problems found." });
  }

  let host: Report["hostname"];
  if (hostname?.trim() && chain[0]) {
    const ok = hostMatches(hostname, chain[0].sans, chain[0].cn);
    host = { name: hostname.trim(), ok };
    if (!ok) issues.unshift({ level: "critical", text: `"${hostname.trim()}" does not match the certificate. It covers: ${chain[0].sans.map((s) => s.replace(/^\w+:/, "")).join(", ") || chain[0].cn}. Note that *.example.com does not cover example.com or a.b.example.com.` });
  }

  const fixedBundle = chain.filter((c) => !(c.selfSigned && chain.length > 1)).map((c) => c.pem.trim()).join("\n") + (chain.length ? "\n" : "");
  return { certs: all, chain, issues, fixedBundle, privateKey, hostname: host };
}
