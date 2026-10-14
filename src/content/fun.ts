export const medium = {
  profile: "https://medium.com/@yohansenadheera",
  articles: [
    {
      title: "How I Went Cloud-Agnostic With the Argo Ecosystem",
      date: "Sep 2026",
      blurb: "Replacing fragmented CI/CD with a pull-based, zero-inbound delivery platform on Argo Workflows and NATS.",
      url: "https://medium.com/@yohansenadheera/how-i-went-cloud-agnostic-with-the-argo-ecosystem-4725b08290a9",
      tag: "CI/CD",
    },
    {
      title: "Replaced Manual Certificate Signing Across 20+ Microservices With a Pipeline",
      date: "Sep 2026",
      blurb: "Moving certificate issuance into an automated pipeline, and the six problems I hit along the way.",
      url: "https://medium.com/@yohansenadheera/replaced-manual-certificate-signing-across-20-microservices-with-a-pipeline-f166a00d63f6",
      tag: "PKI",
    },
    {
      title: "PKI, TLS, and mTLS: The OpenSSL Values That Actually Matters",
      date: "Sep 2026",
      blurb: "The certificate fields, OpenSSL commands and trust models that decide identity and mutual TLS in production.",
      url: "https://medium.com/@yohansenadheera/pki-tls-and-mtls-the-openssl-values-that-actually-matters-1ab7c6535525",
      tag: "Security",
    },
    {
      title: "How I Triggered an Azure DevOps Pipeline in Another Organization (Without a PAT)",
      date: "Aug 2026",
      blurb: "Cross-organisation pipeline triggers with Workload Identity Federation and narrow permissions instead of a token.",
      url: "https://medium.com/@yohansenadheera/how-i-triggered-an-azure-devops-pipeline-in-another-organization-without-a-pat-7b10466b04d6",
      tag: "Azure",
    },
  ],
};

export const socials = [
  { name: "Instagram", icon: "📸", url: "https://www.instagram.com/_.yokka._/" },
  { name: "Facebook", icon: "👍", url: "https://www.facebook.com/yohan.senadheera.7/" },
  { name: "WhatsApp", icon: "💬", url: "https://wa.me/94768022347" },
  { name: "Medium", icon: "✍", url: "https://medium.com/@yohansenadheera" },
];

export type TravelMedia = { type: "image" | "video"; src: string; caption?: string };
export type Trip = { place: string; date: string; story: string; media: TravelMedia[] };
export const travel: Trip[] = [];
