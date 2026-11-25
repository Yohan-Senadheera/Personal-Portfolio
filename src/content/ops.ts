export const statusAsOf = "23 Nov 2026";

export const metrics = [
  {
    value: "20+",
    label: "microservices on automated certificates",
    note: "Replaced manual, per-service self-signing with CA-signed issuance at WSO2, delivered as pull requests across 7 repositories.",
    big: true,
  },
  {
    value: "50+",
    label: "secret injections replaced",
    note: "inline sed-based injections moved to External Secrets Operator",
  },
  {
    value: "2",
    label: "clouds validated",
    note: "pull-based Argo CI/CD platform tested end to end on EKS and AKS",
  },
  {
    value: "18",
    label: "public contributions",
    note: "5 PRs to WSO2's public Terraform libraries (3 merged), 3 PRs (1 merged and backported) + 2 issues in Argo Workflows, OpenChoreo (3 merged), the Kubernetes Python client (1 merged), Prometheus and OpenAPI Generator (4 in review)",
  },
  {
    value: "4",
    label: "engineering articles",
    note: "on Medium, about the platform, PKI and mTLS work",
  },
] as const;

export type Contribution = {
  repo: string;
  ref: string;
  title: string;
  status: "merged" | "review" | "approved" | "issue";
  url: string;
};

export const contributions: Contribution[] = [
  {
    repo: "wso2/azure-terraform-modules",
    ref: "#217",
    title: "Group and Build-Definition-Permissions modules",
    status: "merged",
    url: "https://github.com/wso2/azure-terraform-modules/pull/217",
  },
  {
    repo: "wso2/azure-terraform-modules",
    ref: "#221",
    title: "Project-Permissions module",
    status: "merged",
    url: "https://github.com/wso2/azure-terraform-modules/pull/221",
  },
  {
    repo: "wso2/azure-terraform-modules",
    ref: "#226",
    title: "License type input for Service-Principal-Entitlement",
    status: "merged",
    url: "https://github.com/wso2/azure-terraform-modules/pull/226",
  },
  {
    repo: "wso2/azure-terraform-modules",
    ref: "#224",
    title: "Argo control plane, data plane and Entra SSO modules",
    status: "review",
    url: "https://github.com/wso2/azure-terraform-modules/pull/224",
  },
  {
    repo: "wso2/aws-terraform-modules",
    ref: "#235",
    title: "Argo Control Plane and Argo Data Plane modules",
    status: "review",
    url: "https://github.com/wso2/aws-terraform-modules/pull/235",
  },
  {
    repo: "argoproj/argo-workflows",
    ref: "#17131",
    title: "docs: SSO group claims are not revalidated mid-session (backported to 4.0 and 4.1)",
    status: "merged",
    url: "https://github.com/argoproj/argo-workflows/pull/17131",
  },
  {
    repo: "argoproj/argo-workflows",
    ref: "#17142",
    title: "fix(ui): report denied workflow actions instead of success",
    status: "review",
    url: "https://github.com/argoproj/argo-workflows/pull/17142",
  },
  {
    repo: "argoproj/argo-workflows",
    ref: "#17527",
    title: "fix(ui): keep workflow details tab icons clickable when the toolbar is full",
    status: "review",
    url: "https://github.com/argoproj/argo-workflows/pull/17527",
  },
  {
    repo: "kubernetes-client/python",
    ref: "#2794",
    title: "Trust ca_cert_data in the websocket client",
    status: "merged",
    url: "https://github.com/kubernetes-client/python/pull/2794",
  },
  {
    repo: "OpenAPITools/openapi-generator",
    ref: "#25796",
    title: "[python] honor assert_hostname in the asyncio and httpx clients",
    status: "review",
    url: "https://github.com/OpenAPITools/openapi-generator/pull/25796",
  },
  {
    repo: "kubernetes-client/python",
    ref: "#2795",
    title: "Honor assert_hostname in the asyncio client",
    status: "review",
    url: "https://github.com/kubernetes-client/python/pull/2795",
  },
  {
    repo: "kubernetes-client/gen",
    ref: "#314",
    title: "Honor assert_hostname in the asyncio Python client",
    status: "review",
    url: "https://github.com/kubernetes-client/gen/pull/314",
  },
  {
    repo: "prometheus/client_python",
    ref: "#1261",
    title: "Do not log a traceback when a TLS client disconnects mid-response",
    status: "review",
    url: "https://github.com/prometheus/client_python/pull/1261",
  },
  {
    repo: "openchoreo/community-modules",
    ref: "#909",
    title: "OTel collector: add extra volumes and mounts",
    status: "merged",
    url: "https://github.com/openchoreo/community-modules/pull/909",
  },
  {
    repo: "openchoreo/community-modules",
    ref: "#910",
    title: "Prometheus: add remote write tlsConfig",
    status: "merged",
    url: "https://github.com/openchoreo/community-modules/pull/910",
  },
  {
    repo: "openchoreo/community-modules",
    ref: "#911",
    title: "Fluent Bit: add TLS options",
    status: "merged",
    url: "https://github.com/openchoreo/community-modules/pull/911",
  },
  {
    repo: "argoproj/argo-workflows",
    ref: "#17129",
    title: "Issue: revalidate SSO group claims mid-session",
    status: "issue",
    url: "https://github.com/argoproj/argo-workflows/issues/17129",
  },
  {
    repo: "argoproj/argo-workflows",
    ref: "#17130",
    title: "Issue: UI mishandles RBAC-denied actions",
    status: "issue",
    url: "https://github.com/argoproj/argo-workflows/issues/17130",
  },
];

export const statusLabel: Record<Contribution["status"], string> = {
  merged: "Merged",
  review: "In review",
  approved: "Approved",
  issue: "Issue",
};

export const projectBadge: Record<string, string> = {
  "Pull-Based Multi-Cloud CI/CD Platform": "Production-ready",
  "PKI Certificate Automation": "Running in production",
  "Cloud Reliability Platform (SRE Lab)": "Chaos-tested lab",
  PageRewind: "v0.2.0 released",
  "Private 5G Network Implementation": "Industry project",
  "P-E-BO Desk Companion": "Award-winning",
};

export const nodes = {
  planes: [
    { name: "AKS data plane", note: "Azure", planned: false },
    { name: "EKS data plane", note: "AWS", planned: false },
    { name: "On-premises data plane", note: "planned", planned: true },
  ],
};
