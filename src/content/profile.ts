export const profile = {
  name: "Yohan Senadheera",
  headline: "Computer Engineering Undergraduate",
  tagline: "SRE • DevOps • Kubernetes • Cloud Infrastructure • Private 5G",
  location: "Colombo, Sri Lanka",
  university: "University of Peradeniya",
  website: "yohan-senadheera.pages.dev",
  email: "yohansenadheera@gmail.com",
  phone: ["+94 76 802 2347", "+94 72 579 2197"],
  linkedin: "https://linkedin.com/in/yohan-senadheera",
  github: "https://github.com/yohan-senadheera",
  cvUrl: "/Yohan_Senadheera_CV.pdf",

  summary: `Computer Engineering undergraduate and Site Reliability Engineering Intern at WSO2. Designed a pull-based multi-cloud CI/CD platform on Argo, Kubernetes and Helm (validated on EKS and AKS) with zero inbound connections into production, and automated CA-signed certificate issuance across 20+ microservices. Author of Terraform modules merged into WSO2's public Azure module library, and contributor to upstream Argo Workflows. Also built a Kubernetes reliability lab with Prometheus, Grafana and self-healing, and a private 5G core on Kubernetes. Reviewed code and designs for 40+ students as an instructor.`,

  about: {
    whatIBuild: [
      "Network systems and 5G infrastructure prototypes",
      "Cloud-native platforms on Kubernetes, AWS and Azure",
      "CI/CD, GitOps and certificate automation",
    ],
    whatICareAbout: [
      "Reliability & high availability",
      "Automation & infrastructure as code",
      "Performance optimization & observability",
    ],
    strengths: [
      {
        title: "Networking",
        description:
          "Deep understanding of TCP/IP, SDN, 5G core, and network security",
      },
      {
        title: "Cloud-Native",
        description:
          "Hands-on with Docker, Kubernetes, Helm, Terraform, CI/CD and GitOps on AWS and Azure",
      },
      {
        title: "Fast Learner",
        description:
          "Quickly adapt to new technologies and thrive in collaborative environments",
      },
    ],
  },

  interestingFacts: [
    {
      title: "Adventure & Exploration",
      description:
        "Active senior member of University Explorers' Club, organizing outdoor expeditions and adventure-based programs. Love hiking, trips, and discovering new places.",
      icon: "compass",
    },
    {
      title: "Photography & Video Editing",
      description:
        "Passionate about capturing moments through photography and bringing stories to life through video editing.",
      icon: "camera",
    },
    {
      title: "Building & Creating",
      description:
        "Enjoy hands-on building experiences — from hardware projects to digital solutions. Always excited to try new technologies and create meaningful things.",
      icon: "tool",
    },
    {
      title: "Sports & Precision",
      description:
        "Founded and led the University Shooting Sports Association as Team Captain, guiding the team to the championship at the 2024 Inter-University Air Rifle Competition.",
      icon: "target",
    },
  ],

  projects: [
    {
      title: "Pull-Based Multi-Cloud CI/CD Platform",
      subtitle: "SRE Internship — WSO2",
      type: "Internship Project",
      timeframe: "Apr 2026 – Present",
      description:
        "A cloud-agnostic, pull-based platform that moves deployment pipelines from Azure DevOps to Argo Workflows, Argo Events and Argo CD. Each data plane dials out to the control plane over a mutual-TLS NATS bus, so nothing is open inbound into production. Validated end to end on EKS and AKS; on-premises is planned.",
      tech: [
        "Argo Workflows",
        "Argo Events",
        "Argo CD",
        "NATS",
        "Kubernetes",
        "AKS",
        "EKS",
        "Helm",
        "Terraform",
        "External Secrets Operator",
        "AWS",
        "Azure",
      ],
      whatIDid:
        "Designed the pull-based architecture, wrote a generator that produces dispatcher, executor and sensor files from one pipeline registry, replaced 50+ inline sed-based secret injections with External Secrets Operator, and wrote the Terraform modules (multi-AZ, replicated workflow controllers and NATS) for the control and data planes. Ran the knowledge-transfer session and wrote the handover document.",
      result:
        "Validated on EKS and AKS. Argo Terraform modules for Azure and AWS are submitted to WSO2's public repositories and in review.",
      links: {
        repo: "https://github.com/wso2/azure-terraform-modules/pull/224",
      },
      featured: true,
    },
    {
      title: "PKI Certificate Automation",
      subtitle: "SRE Internship — WSO2",
      type: "Internship Project",
      timeframe: "2026",
      description:
        "Replaced a manual, per-service self-signing process with automated CA-signed certificates across 20+ microservices, delivered as pull requests across 7 repositories and taken through WSO2's formal Change Request process.",
      tech: [
        "Terraform",
        "Azure DevOps YAML",
        "Bash",
        "Azure CLI",
        "Azure Key Vault",
        "Workload Identity Federation",
        "Azure RBAC",
        "GitHub",
      ],
      whatIDid:
        "Built the Bash and Azure CLI pipeline that generates CSRs, triggers the central CA pipeline across organisations, polls it to completion and uploads the signed certificate to the key vault. Designed cross-organisation trust with Workload Identity Federation in place of personal access tokens, using separate least-privilege identities. Contributed the authentication and authorisation Terraform modules to WSO2's public Azure module library (PRs #217, #221, #226, merged).",
      result:
        "Stage and production onboarded; static personal access tokens removed from the signing workflow.",
      links: {
        repo: "https://github.com/wso2/azure-terraform-modules/pull/226",
      },
      featured: true,
    },
    {
      title: "Cloud Reliability Platform (SRE Lab)",
      subtitle: "Kubernetes Observability and Recovery",
      type: "Individual Project",
      timeframe: "Feb 2026",
      description:
        "A Kubernetes platform running a containerised FastAPI service and PostgreSQL with dependency-aware readiness, Prometheus metrics, a Grafana golden-signals dashboard and Alertmanager alerting. Checked with chaos experiments (kill the API pod, take the database down) and documented in runbooks.",
      tech: [
        "Kubernetes",
        "Prometheus Operator",
        "Grafana",
        "Alertmanager",
        "FastAPI",
        "PostgreSQL",
        "Docker",
        "Runbooks",
      ],
      whatIDid:
        "Built and deployed the service and the monitoring stack, wrote the alert rules and runbooks, and ran the failure experiments to confirm recovery.",
      result:
        "Self-healing and alerting verified by chaos experiments. Next: SLOs with burn-rate alerts, Loki logs and an automated chaos runner.",
      links: {
        repo: "https://github.com/Yohan-Senadheera/cloud-reliability-platform",
      },
      featured: true,
    },
    {
      title: "Private 5G Network Implementation",
      subtitle: "Final-Year Project with SLTMobitel",
      type: "Group Project",
      timeframe: "Aug 2025 – Present",
      description:
        "A small-scale private 5G network: the Aether SD-Core 5G core on Kubernetes with Helm on a university server, and an edge UPF on a Raspberry Pi with a real 5G RAN to optimise user-plane traffic. Teammates handle RAN virtualisation and core tuning.",
      tech: [
        "Kubernetes",
        "Helm",
        "Aether SD-Core",
        "Raspberry Pi",
        "SDN",
        "Open vSwitch",
        "Wireshark",
      ],
      whatIDid:
        "Deployed the 5G core on Kubernetes with Helm, implemented the edge UPF on a Raspberry Pi, and analysed user-plane traffic with Wireshark and tcpdump.",
      result: "Ongoing industry collaboration with a major telecom provider",
      links: {},
      featured: true,
    },
    {
      title: "Mini 5G Edge Network Testbed (Cloud-Native Networking)",
      subtitle: "5G-Inspired Edge Networking",
      type: "Individual Project",
      timeframe: "Jan 2026 – Present",
      description:
        "5G-inspired, cloud-native edge networking testbed with containerized NF-style components and real-time observability. Features containerized 'network function' style gateway + app, Prometheus + Grafana monitoring (host + container metrics). Roadmap: Kubernetes → AWS deployment.",
      tech: [
        "Networking",
        "Cloud-Native",
        "Docker",
        "Kubernetes",
        "Prometheus",
        "Grafana",
        "Edge",
      ],
      whatIDid:
        "Designed and implemented containerized network function architecture with end-to-end monitoring and edge deployment strategy",
      result:
        "Fully operational cloud-native edge networking testbed with comprehensive observability",
      links: {
        repo: "https://github.com/Yohan-Senadheera/mini-5g-edge-testbed",
      },
      featured: false,
    },
    {
      title: "P-E-BO Desk Companion",
      subtitle: "Third Year Project",
      type: "Group Project",
      timeframe: "Dec 2024 – Jul 2025",
      description:
        "An AI desk companion robot with emotion recognition and Gemini voice interaction. Teammates handled hardware, Raspberry Pi and 3D printing.",
      tech: ["React Native", "Firebase", "AWS", "Gemini AI", "IoT"],
      whatIDid:
        "Developed the React Native app with Firebase authentication and real-time sync, AWS Rekognition face recognition with S3, QR-code Wi-Fi provisioning, over-the-air updates and the project website",
      result:
        "IESL Undergraduate Inventor of the Year Top 10 finalist, 3rd place at ICIIS 2025 (I-To-I), and exhibited at Techno 2025.",
      links: {
        repo: "https://github.com/Yohan-Senadheera/e20-3yp-P-E-BO-Desk-Companion",
        demo: "https://cepdnaclk.github.io/e20-3yp-P-E-BO-Desk-Companion/",
      },
      featured: true,
    },
    {
      title: "MONA Dashboard",
      subtitle: "Second Year Project",
      type: "Group Project",
      timeframe: "Apr 2024 – Oct 2024",
      description:
        "Production rate tracking dashboard enabling real-time machine monitoring, bottleneck detection, and process optimization.",
      tech: ["MongoDB", "JavaScript", "React.js", "Python", "SCSS", "GitHub"],
      whatIDid:
        "Developed production rate tracking page with real-time monitoring and bottleneck detection",
      result: "Successfully deployed for manufacturing process optimization",
      links: {
        repo: "https://github.com/Yohan-Senadheera/e20-co227-MONA-Dashboard",
      },
      featured: false,
    },
    {
      title: "Personalized AI Feedback for Higher Education",
      subtitle: "Final Year Project",
      type: "Group Project",
      timeframe: "Aug 2024 – Present",
      description:
        "Personalized adaptive learning system with virtual teaching assistant. Team handles data processing, model training, and LMS integration.",
      tech: ["Python", "Node.js", "GPT-3.5", "Moodle"],
      whatIDid:
        "Implemented AI modules and virtual teaching assistant integration",
      result: "Ongoing development with university LMS integration",
      links: {
        repo: "https://github.com/Yohan-Senadheera/ai-feedback-tutoring-system",
      },
      featured: false,
    },
    {
      title: "Smart Home Energy Automation",
      subtitle: "Mobile Application",
      type: "Group Project",
      timeframe: "Feb 2025 – Apr 2025",
      description:
        "React Native app for smart home project with Firebase real-time sync, alerts, and remote control capabilities.",
      tech: ["React Native", "Expo", "Firebase", "IoT", "ESP32", "Arduino"],
      whatIDid:
        "Developed complete mobile application with real-time sync and control features",
      result: "Fully functional smart home control system",
      links: { repo: "https://github.com/Yohan-Senadheera/energy-app" },
      featured: false,
    },
  ],

  skills: {
    "DevOps & Cloud": [
      "Docker",
      "Kubernetes",
      "Helm",
      "Argo Workflows",
      "Argo CD",
      "Terraform",
      "AWS",
      "Azure",
      "CI/CD",
      "GitOps",
      "Git",
      "Bash",
    ],
    "SRE & Observability": [
      "Prometheus",
      "Grafana",
      "Alertmanager",
      "Alerting",
      "Chaos Testing",
      "Runbooks",
      "Linux Troubleshooting",
    ],
    "Security & Identity": [
      "OIDC",
      "mTLS",
      "RBAC Design",
      "PKI & Certificates",
      "External Secrets",
      "Workload Identity Federation",
      "Network Security",
    ],
    Networking: [
      "TCP/IP",
      "VLANs",
      "Switching",
      "Routing",
      "SDN",
      "5G",
      "Wireshark",
      "STP",
      "EtherChannel",
    ],
    Programming: [
      "Python",
      "C",
      "JavaScript",
      "React",
      "React Native",
      "Node.js",
    ],
    "Databases & Tools": ["SQL", "Firebase", "MongoDB", "Linux Administration"],
  },

  currentlyLearning: ["Certified Kubernetes Administrator (CKA)"],

  experience: [
    {
      title: "SRE Intern",
      organization: "WSO2",
      timeframe: "Apr 2026 – Present",
      description:
        "Worked on two platform workstreams: a pull-based multi-cloud CI/CD platform on Argo (validated on EKS and AKS), and automated CA-signed certificate issuance across 20+ microservices. Contributed Terraform modules to WSO2's public Azure library and issues and pull requests to upstream Argo Workflows. Open a project below for the details.",
      type: "work",
    },
    {
      title: "Casual Instructor",
      subtitle: "Database Systems / Programming Methodology",
      organization: "Dept. of Computer Engineering, University of Peradeniya",
      timeframe: "Nov 2024 – Aug 2025",
      description:
        "Taught 40+ students database systems and C programming through lab sessions and mentoring.",
      type: "teaching",
    },
    {
      title: "Team Captain",
      organization: "Shooting Sports Association, University of Peradeniya",
      timeframe: "Jul 2023 – Oct 2025",
      description:
        "Initiated air gun shooting sport at university, served as captain for 2 years, led team to championship at 2024 Inter-University Air Rifle Competition.",
      type: "leadership",
    },
    {
      title: "Editor",
      organization: "Hackers' Club, University of Peradeniya",
      timeframe: "Aug 2025 – Jul 2026",
      description:
        "Manage technical content, event coordination, and club communications for 200+ member community.",
      type: "leadership",
    },
    {
      title: "Senior Member",
      organization: "University Explorers' Club, University of Peradeniya",
      timeframe: "Jul 2024 – Present",
      description:
        "Organize outdoor expeditions and adventure-based leadership programs.",
      type: "leadership",
    },
    {
      title: "Programming Team Member",
      organization: "IEEE CS Student Chapter, University of Peradeniya",
      timeframe: "Jul 2024 – Nov 2025",
      description:
        "Organized technical workshops and coding competitions for student community.",
      type: "technical",
    },
    {
      title: "Finance Vice Chair",
      subtitle: "Central Province Organizing Committee",
      organization: "Career Compass Event, IEEE Young Professionals Sri Lanka",
      timeframe: "Apr 2025 – Sep 2025",
      description:
        "Managed event finances, ensuring accurate budgeting, strategic fund allocation, and post-budget analysis.",
      type: "leadership",
    },
    {
      title: "Brand Manager / OC Vice President / Team Leader",
      organization: "AIESEC in Kandy, University of Peradeniya",
      timeframe: "Feb 2022 – Nov 2024",
      description:
        "Led marketing campaigns and coordinated international exchange programs across cross-functional teams.",
      type: "leadership",
      expandable: true,
      details:
        "Managed brand identity and marketing strategy, facilitated international exchange opportunities, and led cross-functional teams to execute large-scale university events.",
    },
    {
      title: "Trainee",
      organization: "People's Bank",
      timeframe: "May 2021 – Feb 2022",
      description: "Banking operations and customer service experience.",
      type: "work",
    },
  ],

  awards: [
    {
      title: "IESL Undergraduate Inventor of the Year",
      subtitle: "Top 10 Finalist",
      project: "P-E-BO Project",
      date: "Oct 2025",
      highlight: true,
    },
    {
      title: "I-To-I / ICIIS 2025",
      subtitle: "3rd Place",
      project: "P-E-BO Project",
      date: "Nov 2025",
      highlight: true,
    },
    {
      title: "Inter-University Air Rifle Championship",
      subtitle: "Team Champion",
      project: "Air Rifle 15 shots Men's Team",
      date: "Aug 2024",
      highlight: false,
    },
    {
      title: "Magam Shooting Sports Colours Insignia",
      date: "Aug 2024",
      highlight: false,
    },
    {
      title: "Best Event Marketer",
      organization: "AIESEC in University of Peradeniya",
      date: "Feb 2024",
      highlight: false,
    },
  ],

  certifications: [
    {
      title: "WSO2 Certified Identity Server Practitioner",
      issuer: "WSO2",
      date: "Aug 2026",
      status: "completed",
    },
    {
      title: "Certified Kubernetes Administrator (CKA)",
      issuer: "KodeKloud (Udemy)",
      status: "in-progress",
    },
    {
      title: "Docker / Kubernetes for Beginners",
      issuer: "KodeKloud (Coursera)",
      date: "Mar 2026",
      status: "completed",
    },
    {
      title: "AWS Technical Essentials",
      issuer: "AWS (Coursera)",
      date: "Jan 2026",
      status: "completed",
    },
    {
      title: "5G for Everyone",
      issuer: "Qualcomm (Coursera)",
      date: "Sep 2025",
      status: "completed",
    },
    {
      title: "Hands-on Linux Commands & Shell Scripting",
      issuer: "IBM (Coursera)",
      date: "May 2025",
      status: "completed",
    },
    {
      title: "CCNA 1, 2 & 3",
      issuer: "Cisco Networking Academy",
      date: "Aug 2026",
      status: "completed",
    },
    {
      title: "MoraExtreme 9.0",
      subtitle: "27th Place",
      issuer: "IEEE Student Branch, University of Moratuwa",
      date: "Oct 2024",
      status: "completed",
    },
    {
      title: "Coders V11.0",
      subtitle: "9th Place",
      issuer: "ACES, University of Peradeniya",
      date: "Oct 2024",
      status: "completed",
    },
  ],

  education: [
    {
      degree: "B.Sc. Eng. (Hons) in Computer Engineering",
      institution: "University of Peradeniya",
      timeframe: "Feb 2022 – Present",
      courses: [
        "Advanced Communication Networks (SDN, Docker)",
        "Network Security",
        "Databases",
        "Software Architecture",
      ],
    },
    {
      degree: "CCNA (Cisco Certified Network Associate)",
      institution: "Cisco Networking Academy",
      timeframe: "Completed — CCNA 1, 2 & 3",
      courses: [
        "TCP/IP",
        "Subnetting",
        "Switching",
        "VLANs",
        "Routing",
        "Network Security",
      ],
    },
  ],

  contact: {
    cta: "Currently working as an SRE Intern at WSO2.",
    availability: "SRE Intern at WSO2",
  },

  navigation: [
    { id: "hero", label: "Home" },
    { id: "about", label: "About" },
    { id: "facts", label: "Facts" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
    { id: "awards", label: "Awards" },
    { id: "certifications", label: "Courses" },
    { id: "contact", label: "Contact" },
  ],
} as const;

export type Profile = typeof profile;
