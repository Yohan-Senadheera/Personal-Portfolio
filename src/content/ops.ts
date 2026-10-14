export const statusAsOf = "8 Oct 2026";

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
    value: "9",
    label: "public contributions",
    note: "5 PRs to WSO2's public Terraform libraries (3 merged), 2 PRs + 2 issues upstream in Argo Workflows",
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
    title: "docs: SSO group claims are not revalidated mid-session",
    status: "approved",
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
  "Pull-Based Multi-Cloud CI/CD Platform": "Validated on EKS + AKS",
  "PKI Certificate Automation": "Stage + prod onboarded",
  "Cloud Reliability Platform (SRE Lab)": "Chaos-tested lab",
  "Private 5G Network Implementation": "Ongoing",
  "P-E-BO Desk Companion": "Award-winning",
};

export const nodes = {
  planes: [
    { name: "AKS data plane", note: "Azure", planned: false },
    { name: "EKS data plane", note: "AWS", planned: false },
    { name: "On-premises data plane", note: "planned", planned: true },
  ],
};
