// Diagnoses `kubectl describe pod` output.

export type Severity = "critical" | "warn" | "info" | "ok";

export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  why: string;
  evidence: string[];
  fixes: string[];
  commands: string[];
};

export type Container = {
  name: string;
  init: boolean;
  image?: string;
  state?: string;
  stateReason?: string;
  lastState?: string;
  lastReason?: string;
  exitCode?: number;
  ready?: boolean;
  restarts?: number;
  limits: Record<string, string>;
  requests: Record<string, string>;
  liveness?: string;
  readiness?: string;
  startup?: string;
};

export type PodEvent = { type: string; reason: string; age: string; from: string; message: string };

export type Pod = {
  name?: string;
  namespace?: string;
  node?: string;
  status?: string;
  reason?: string;
  message?: string;
  containers: Container[];
  events: PodEvent[];
};


function field(block: string, key: string): string | undefined {
  const m = block.match(new RegExp(`^\\s*${key}:[ \\t]*(.*)$`, "m"));
  return m ? m[1].trim() : undefined;
}

function parseContainers(text: string, header: string, init: boolean): Container[] {
  const start = text.search(new RegExp(`^${header}:\\s*$`, "m"));
  if (start < 0) return [];
  const lines = text.slice(start).split(/\r?\n/).slice(1);
  const out: Container[] = [];
  let cur: string[] | null = null;
  let name = "";
  const flush = () => {
    if (cur) out.push(parseContainer(name, cur, init));
  };
  for (const line of lines) {
    if (/^\S/.test(line)) break; // next top-level section
    const head = line.match(/^ {2}([^\s:][^:]*):\s*$/);
    if (head) {
      flush();
      name = head[1].trim();
      cur = [];
    } else if (cur) cur.push(line);
  }
  flush();
  return out;
}

function parseResources(lines: string[], key: string): Record<string, string> {
  const res: Record<string, string> = {};
  const i = lines.findIndex((l) => new RegExp(`^\\s{4}${key}:\\s*$`).test(l));
  if (i < 0) return res;
  for (const l of lines.slice(i + 1)) {
    const m = l.match(/^\s{6}([\w./-]+):\s+(\S+)/);
    if (!m) break;
    res[m[1]] = m[2];
  }
  return res;
}

function parseContainer(name: string, lines: string[], init: boolean): Container {
  const block = lines.join("\n");
  const c: Container = {
    name,
    init,
    image: field(block, "Image"),
    limits: parseResources(lines, "Limits"),
    requests: parseResources(lines, "Requests"),
    liveness: field(block, "Liveness"),
    readiness: field(block, "Readiness"),
    startup: field(block, "Startup"),
  };
  const si = lines.findIndex((l) => /^\s{4}State:/.test(l));
  const li = lines.findIndex((l) => /^\s{4}Last State:/.test(l));
  const sub = (from: number, key: string) => {
    if (from < 0) return undefined;
    for (const l of lines.slice(from + 1)) {
      if (/^\s{4}\S/.test(l)) break;
      const m = l.match(new RegExp(`^\\s{6}${key}:\\s+(.*)$`));
      if (m) return m[1].trim();
    }
    return undefined;
  };
  if (si >= 0) {
    c.state = lines[si].replace(/^\s*State:\s*/, "").trim();
    c.stateReason = sub(si, "Reason");
  }
  if (li >= 0) {
    c.lastState = lines[li].replace(/^\s*Last State:\s*/, "").trim();
    c.lastReason = sub(li, "Reason");
    const code = sub(li, "Exit Code");
    if (code !== undefined) c.exitCode = Number(code);
  }
  if (c.exitCode === undefined && c.state === "Terminated") {
    const code = sub(si, "Exit Code");
    if (code !== undefined) c.exitCode = Number(code);
    c.lastReason ??= c.stateReason;
  }
  const ready = field(block, "Ready");
  if (ready) c.ready = ready === "True";
  const rc = field(block, "Restart Count");
  if (rc) c.restarts = Number(rc);
  return c;
}

function parseEvents(text: string): PodEvent[] {
  const i = text.search(/^Events:/m);
  const body = i >= 0 ? text.slice(i).split(/\r?\n/).slice(1) : text.split(/\r?\n/);
  const out: PodEvent[] = [];
  for (const raw of body) {
    const line = raw.trim();
    if (!line || /^-+(\s+-+)*$/.test(line) || /^Type\s+Reason/.test(line)) continue;
    // describe format: Type  Reason  Age  From  Message
    let m = line.match(/^(Normal|Warning)\s{2,}(\S+)\s{2,}(.+?)\s{2,}(\S+(?:,\s*\S+)?)\s{2,}([\s\S]+)$/);
    if (m) {
      out.push({ type: m[1], reason: m[2], age: m[3], from: m[4], message: m[5] });
      continue;
    }
    // `kubectl get events` format: LAST SEEN  TYPE  REASON  OBJECT  MESSAGE
    m = line.match(/^(\S+)\s+(Normal|Warning)\s+(\S+)\s+(\S+)\s+([\s\S]+)$/);
    if (m) out.push({ type: m[2], reason: m[3], age: m[1], from: m[4], message: m[5] });
    else if (out.length && i >= 0 && /^\s{20,}/.test(raw)) out[out.length - 1].message += " " + line; // wrapped message
  }
  return out;
}

export function parsePod(text: string): Pod {
  const head = text.split(/^Containers:|^Init Containers:/m)[0];
  return {
    name: field(head, "Name"),
    namespace: field(head, "Namespace"),
    node: field(head, "Node")?.split("/")[0],
    status: field(head, "Status"),
    reason: field(head, "Reason"),
    message: field(head, "Message"),
    containers: [...parseContainers(text, "Init Containers", true), ...parseContainers(text, "Containers", false)],
    events: parseEvents(text),
  };
}


const EXIT: Record<number, [string, string]> = {
  0: ["exited successfully", "The process finished and exited with code 0. Kubernetes restarts containers in a Deployment whenever they stop, so a container that finishes its work looks like a crash."],
  1: ["the application exited with an error", "Exit code 1 is a generic application error: an unhandled exception, a failed startup check, a missing environment variable or a bad config file. The logs from the previous run will say which."],
  2: ["the application exited with an error (often bad arguments)", "Exit code 2 usually means the program was started with invalid arguments or a shell builtin was misused."],
  126: ["the command could not be executed", "Exit code 126 means the file exists but cannot be run: it is not executable (missing chmod +x) or the user has no permission."],
  127: ["the command was not found", "Exit code 127 means the command or entrypoint does not exist in the image, or it is not on $PATH."],
  134: ["the process aborted (SIGABRT)", "Exit code 134 means the process called abort(): often a failed assertion or a fatal runtime error."],
  137: ["the process was killed (SIGKILL)", "Exit code 137 means the container was killed with SIGKILL. Without an OOMKilled reason, the usual causes are a failing liveness probe that did not stop in time, or the node running out of memory."],
  139: ["the process crashed (segmentation fault)", "Exit code 139 is a segfault: the program accessed invalid memory. Often a native library built for a different platform or a bug in native code."],
  143: ["the process was stopped (SIGTERM)", "Exit code 143 means the container received SIGTERM and exited. Kubernetes sends it when a liveness probe fails, during a rollout, or when the pod is deleted."],
  255: ["the process exited with an unknown error", "Exit code 255 is a catch-all error, often from a script or an entrypoint that failed before the app started."],
};

const has = (s: string | undefined, re: RegExp) => !!s && re.test(s);

export function diagnose(text: string): { pod: Pod; findings: Finding[] } {
  const pod = parsePod(text);
  const findings: Finding[] = [];
  const seen = new Set<string>();
  const add = (f: Finding) => {
    if (seen.has(f.id)) return;
    seen.add(f.id);
    findings.push(f);
  };

  const p = pod.name ?? "<pod>";
  const ns = pod.namespace && pod.namespace !== "default" ? ` -n ${pod.namespace}` : "";
  const warn = pod.events.filter((e) => e.type === "Warning");
  const msgs = (re: RegExp) => pod.events.filter((e) => re.test(e.reason) || re.test(e.message));
  const all = text;
  const ev = (e: PodEvent) => `${e.type}  ${e.reason}  ${e.age}  ${e.message}`.replace(/\s+/g, " ").trim();

  const sched = msgs(/FailedScheduling|nodes are available/);
  const schedText = sched.map((e) => e.message).join(" ") || (all.match(/\d+\/\d+ nodes are available[^\n]*/)?.[0] ?? "");
  if (schedText) {
    const evidence = sched.length ? sched.slice(0, 2).map(ev) : [schedText];
    const insuff = [...new Set([...schedText.matchAll(/Insufficient ([\w./-]+)/g)].map((m) => m[1].replace(/\.+$/, "")))];
    if (insuff.length) {
      const req = pod.containers
        .filter((c) => !c.init)
        .map((c) => `${c.name}: ${insuff.map((r) => `${r} request ${c.requests[r] ?? "not set"}`).join(", ")}`);
      add({
        id: "sched-insufficient",
        severity: "critical",
        title: `Pending: no node has enough free ${insuff.join(" and ")}`,
        why: `The scheduler could not find a node with enough unreserved ${insuff.join(" and ")} for this pod's requests. Requests are what the pod reserves, not what it uses, so a node can look idle and still be "full".`,
        evidence: [...evidence, ...req],
        fixes: [
          "Lower the container requests if they are higher than the real usage (check with kubectl top pod).",
          "Add nodes, or let the cluster autoscaler scale up (check that the node pool is not at its max size).",
          "Look for other pods with oversized requests on the nodes.",
        ],
        commands: [
          `kubectl describe nodes | grep -A8 "Allocated resources"`,
          `kubectl top nodes`,
          `kubectl get pod ${p}${ns} -o jsonpath='{.spec.containers[*].resources}'`,
        ],
      });
    }
    const taint = schedText.match(/untolerated taint\(?s?\)?\s*(\{[^}]*\})|had taints? (\{[^}]*\}), that the pod didn't tolerate/);
    if (taint) {
      add({
        id: "sched-taint",
        severity: "critical",
        title: "Pending: the nodes have a taint this pod does not tolerate",
        why: `Some nodes are tainted ${taint[1] ?? taint[2]}, which keeps pods away unless they carry a matching toleration. Control-plane nodes, GPU pools and spot pools are often tainted like this.`,
        evidence,
        fixes: [
          "If the pod should run there, add a matching toleration to the pod spec.",
          "If not, make sure there are untainted nodes with room for it (or remove the taint if it was left by mistake).",
        ],
        commands: [`kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints`],
      });
    }
    if (/didn't match (Pod's )?node (affinity|selector)|node\(s\) didn't match/.test(schedText)) {
      add({
        id: "sched-affinity",
        severity: "critical",
        title: "Pending: no node matches the pod's nodeSelector or node affinity",
        why: "The pod asks for nodes with specific labels, and no node with free capacity has them. A typo in a label, or a node pool that was renamed or scaled to zero, is the usual cause.",
        evidence,
        fixes: ["Compare the pod's nodeSelector/affinity with the real node labels.", "Fix the label on the pod, or label the right nodes."],
        commands: [
          `kubectl get pod ${p}${ns} -o jsonpath='{.spec.nodeSelector}{"\\n"}{.spec.affinity}'`,
          `kubectl get nodes --show-labels`,
        ],
      });
    }
    if (/anti-affinity/.test(schedText)) {
      add({
        id: "sched-anti",
        severity: "warn",
        title: "Pending: pod anti-affinity rules leave no valid node",
        why: "A required anti-affinity rule (for example one replica per node or per zone) cannot be met because there are more replicas than nodes or zones.",
        evidence,
        fixes: ["Add nodes in more zones, reduce replicas, or change the rule to preferredDuringSchedulingIgnoredDuringExecution."],
        commands: [`kubectl get pod ${p}${ns} -o jsonpath='{.spec.affinity.podAntiAffinity}'`],
      });
    }
    if (/unbound immediate PersistentVolumeClaims|persistentvolumeclaim "[^"]+" not found/.test(schedText)) {
      add({
        id: "sched-pvc",
        severity: "critical",
        title: "Pending: its PersistentVolumeClaim is not bound",
        why: "The pod mounts a PVC that has no volume yet. Either the PVC does not exist, its StorageClass is wrong or missing, or the provisioner failed to create the disk.",
        evidence,
        fixes: [
          "Check that the PVC exists in the same namespace and is Bound.",
          "Check its StorageClass exists and the CSI driver pods are healthy.",
        ],
        commands: [`kubectl get pvc${ns}`, `kubectl describe pvc <claim-name>${ns}`, `kubectl get storageclass`],
      });
    }
    if (/volume node affinity conflict/.test(schedText)) {
      add({
        id: "sched-zone",
        severity: "critical",
        title: "Pending: its volume is in a different zone from the free nodes",
        why: "Cloud disks live in one availability zone. The pod's existing volume is in a zone where no node has room, so it cannot be scheduled anywhere it could attach the disk.",
        evidence,
        fixes: [
          "Add node capacity in the volume's zone.",
          "Use a StorageClass with volumeBindingMode: WaitForFirstConsumer so new volumes follow the pod.",
        ],
        commands: [`kubectl get pv -o custom-columns=NAME:.metadata.name,ZONE:.spec.nodeAffinity`, `kubectl get nodes -L topology.kubernetes.io/zone`],
      });
    }
    if (/Too many pods/.test(schedText)) {
      add({
        id: "sched-maxpods",
        severity: "critical",
        title: "Pending: the nodes hit their maximum pod count",
        why: "Each node has a pod limit (on EKS it depends on the instance type's network interfaces, on AKS on the maxPods setting). Small nodes can run out of pod slots long before CPU or memory.",
        evidence,
        fixes: ["Use larger nodes or add nodes.", "On EKS, enable prefix delegation in the VPC CNI; on AKS, create a node pool with a higher maxPods."],
        commands: [`kubectl get nodes -o custom-columns=NAME:.metadata.name,PODS:.status.allocatable.pods`],
      });
    }
    if (/free ports/.test(schedText)) {
      add({
        id: "sched-port",
        severity: "warn",
        title: "Pending: the hostPort it needs is already taken",
        why: "The pod uses a hostPort, and every node already runs a pod on that port.",
        evidence,
        fixes: ["Remove hostPort and use a Service instead, or make sure there are as many nodes as replicas."],
        commands: [`kubectl get pod ${p}${ns} -o jsonpath='{.spec.containers[*].ports}'`],
      });
    }
    if (/were unschedulable/.test(schedText)) {
      add({
        id: "sched-cordon",
        severity: "warn",
        title: "Some nodes are cordoned",
        why: "Cordoned nodes (SchedulingDisabled) accept no new pods, usually during an upgrade or drain.",
        evidence,
        fixes: ["Finish the maintenance and uncordon the nodes, or add capacity elsewhere."],
        commands: [`kubectl get nodes`, `kubectl uncordon <node>`],
      });
    }
    if (!findings.some((f) => f.id.startsWith("sched-"))) {
      add({
        id: "sched-generic",
        severity: "critical",
        title: "Pending: the scheduler cannot place the pod",
        why: "The scheduler rejected every node. The event message lists the reason for each group of nodes.",
        evidence,
        fixes: ["Read each 'N node(s) ...' reason in the message; they add up to the total node count."],
        commands: [`kubectl get events${ns} --field-selector involvedObject.name=${p}`],
      });
    }
  }

  if (/exceeded quota/.test(all)) {
    add({
      id: "quota",
      severity: "critical",
      title: "Blocked by a ResourceQuota",
      why: "The namespace has a ResourceQuota, and creating this pod would go over it. The pod is rejected before it is even scheduled, so look for this on the ReplicaSet or Job events.",
      evidence: [all.match(/[^\n]*exceeded quota[^\n]*/)?.[0] ?? ""],
      fixes: ["Lower requests/limits, delete unused workloads in the namespace, or raise the quota."],
      commands: [`kubectl describe resourcequota${ns}`],
    });
  }

  const pullEv = msgs(/Failed to pull image|ErrImagePull|ImagePullBackOff|InvalidImageName|Back-off pulling image/);
  const pullC = pod.containers.filter((c) => has(c.stateReason, /ErrImagePull|ImagePullBackOff|InvalidImageName/));
  if (pullEv.length || pullC.length) {
    const m = pullEv.map((e) => e.message).join(" ");
    const imgs = [...new Set(pullC.map((c) => c.image).filter(Boolean))].join(", ") || m.match(/image "([^"]+)"/)?.[1] || "the image";
    const evidence = pullEv.filter((e) => e.type === "Warning").slice(0, 2).map(ev);
    const cmds = [`kubectl get pod ${p}${ns} -o jsonpath='{.spec.containers[*].image}'`];
    if (/InvalidImageName/.test(m) || pullC.some((c) => c.stateReason === "InvalidImageName")) {
      add({
        id: "pull-invalid",
        severity: "critical",
        title: "The image name is not valid",
        why: `Kubernetes could not parse ${imgs}. Common causes: uppercase letters, a stray space, "https://" in front, or an empty variable in a Helm template.`,
        evidence,
        fixes: ["Fix the image reference: registry/repository:tag, all lowercase."],
        commands: cmds,
      });
    } else if (/unauthorized|authentication required|pull access denied|403 Forbidden|denied:|no basic auth credentials/i.test(m)) {
      add({
        id: "pull-auth",
        severity: "critical",
        title: "The node is not allowed to pull the image",
        why: `The registry refused the pull of ${imgs}. The image is private and the pod has no valid credentials, or the name is wrong (Docker Hub answers "pull access denied" for images that do not exist too).`,
        evidence,
        fixes: [
          "Check the image name and tag are exactly right.",
          "Create a docker-registry secret and reference it in imagePullSecrets (or on the service account).",
          "On AKS attach the ACR to the cluster; on EKS give the node role ECR read access.",
        ],
        commands: [
          ...cmds,
          `kubectl create secret docker-registry regcred --docker-server=<registry> --docker-username=<user> --docker-password=<token>${ns}`,
          `kubectl get sa default${ns} -o jsonpath='{.imagePullSecrets}'`,
        ],
      });
    } else if (/not found|manifest unknown|does not exist|NotFound/i.test(m)) {
      add({
        id: "pull-notfound",
        severity: "critical",
        title: "The image or tag does not exist",
        why: `The registry has no ${imgs}. Usually a typo in the tag, a tag that was never pushed (CI failed), or a tag that was deleted by a cleanup policy.`,
        evidence,
        fixes: ["Check the tag exists in the registry.", "Pin to a tag your CI really pushed, or better, to an image digest."],
        commands: [...cmds, `docker manifest inspect ${imgs.split(",")[0]}`],
      });
    } else if (/toomanyrequests|rate limit/i.test(m)) {
      add({
        id: "pull-rate",
        severity: "critical",
        title: "Docker Hub rate limit reached",
        why: "Anonymous Docker Hub pulls are rate limited per IP. A cluster behind one NAT address hits this quickly.",
        evidence,
        fixes: ["Authenticate pulls with an imagePullSecret.", "Mirror the image into your own registry (ACR, ECR, GHCR) or use a pull-through cache."],
        commands: cmds,
      });
    } else if (/no such host|i\/o timeout|dial tcp|TLS handshake timeout|context deadline exceeded|connection refused/i.test(m)) {
      add({
        id: "pull-network",
        severity: "critical",
        title: "The node cannot reach the registry",
        why: "The pull failed on the network: DNS cannot resolve the registry, or a firewall, proxy or private endpoint blocks it. Private clusters without outbound internet hit this often.",
        evidence,
        fixes: [
          "Check DNS and outbound access from the node (NSG, firewall, NAT gateway, proxy).",
          "For private clusters, use a private endpoint or VPC endpoint for the registry.",
        ],
        commands: [...cmds, `kubectl run nettest --rm -it --image=busybox --restart=Never -- nslookup <registry-host>`],
      });
    } else if (/no match for platform/i.test(m)) {
      add({
        id: "pull-arch",
        severity: "critical",
        title: "The image has no build for this node's CPU architecture",
        why: "The image was built only for amd64 (or only arm64) and the node is the other one, for example Graviton or Apple-silicon builds.",
        evidence,
        fixes: ["Build a multi-arch image with docker buildx --platform linux/amd64,linux/arm64.", "Or schedule onto matching nodes with a kubernetes.io/arch nodeSelector."],
        commands: [`kubectl get nodes -L kubernetes.io/arch`],
      });
    } else {
      add({
        id: "pull-generic",
        severity: "critical",
        title: "The image cannot be pulled",
        why: `Kubernetes keeps failing to pull ${imgs} and is backing off between attempts. The first "Failed to pull image" event has the real reason.`,
        evidence: evidence.length ? evidence : pullC.map((c) => `${c.name}: ${c.stateReason}`),
        fixes: ["Read the full 'Failed to pull image' message: it says if it is auth, not found, or network."],
        commands: [`kubectl get events${ns} --field-selector involvedObject.name=${p}`],
      });
    }
  }

  for (const m of all.matchAll(/(secret|configmap)s? "([^"]+)" not found/gi)) {
    const kind = m[1].toLowerCase() === "secret" ? "Secret" : "ConfigMap";
    add({
      id: `cfg-missing-${kind}-${m[2]}`,
      severity: "critical",
      title: `${kind} "${m[2]}" does not exist`,
      why: `The pod uses the ${kind} "${m[2]}" (as env vars or a volume), but there is no ${kind} with that name in ${pod.namespace ?? "this"} namespace. The container cannot start until it exists. ${kind === "Secret" ? "If you use External Secrets Operator or Sealed Secrets, the sync may have failed." : ""}`.trim(),
      evidence: [m[0]],
      fixes: [
        `Create the ${kind} in the same namespace as the pod, or fix the name in the pod spec.`,
        kind === "Secret" ? "If it comes from External Secrets, check the ExternalSecret status." : "Check your Helm values or kustomize overlay create it.",
      ],
      commands: [`kubectl get ${kind.toLowerCase()}${ns}`, kind === "Secret" ? `kubectl get externalsecret${ns}` : `kubectl get configmap ${m[2]}${ns} -o yaml`],
    });
  }
  for (const m of all.matchAll(/couldn't find key (\S+) in (Secret|ConfigMap) ([\w./-]+)/g)) {
    add({
      id: `cfg-key-${m[1]}`,
      severity: "critical",
      title: `Key "${m[1]}" is missing from ${m[2]} ${m[3]}`,
      why: `The ${m[2]} exists, but it has no key called "${m[1]}" that the pod reads with secretKeyRef/configMapKeyRef.`,
      evidence: [m[0]],
      fixes: ["Add the key, or fix the key name in the pod spec (keys are case-sensitive).", "Mark it optional: true if the app can run without it."],
      commands: [`kubectl get ${m[2].toLowerCase()} ${m[3].split("/").pop()}${ns} -o jsonpath='{.data}'`],
    });
  }
  if (/runAsNonRoot and image will run as root|image has non-numeric user/.test(all)) {
    add({
      id: "cfg-nonroot",
      severity: "critical",
      title: "The security context requires non-root, but the image runs as root",
      why: "runAsNonRoot: true is set, and the image's USER is root (or a name, which Kubernetes cannot verify).",
      evidence: [all.match(/[^\n]*(runAsNonRoot|non-numeric user)[^\n]*/)?.[0] ?? ""],
      fixes: ["Set runAsUser to a numeric UID (for example 10001) in the securityContext.", "Or set a numeric USER in the Dockerfile."],
      commands: [`kubectl get pod ${p}${ns} -o jsonpath='{.spec.securityContext}{.spec.containers[*].securityContext}'`],
    });
  }
  if (!findings.some((f) => f.id.startsWith("cfg-")) && pod.containers.some((c) => c.stateReason === "CreateContainerConfigError")) {
    add({
      id: "cfg-generic",
      severity: "critical",
      title: "The container config is invalid (CreateContainerConfigError)",
      why: "Kubernetes could not build the container's config. It is almost always a missing Secret, ConfigMap or key referenced by env or envFrom.",
      evidence: pod.events.filter((e) => /Failed/.test(e.reason)).slice(0, 2).map(ev),
      fixes: ["Check every secretKeyRef, configMapKeyRef and envFrom in the spec exists."],
      commands: [`kubectl get events${ns} --field-selector involvedObject.name=${p}`],
    });
  }

  const multi = msgs(/Multi-Attach error/);
  if (multi.length) {
    add({
      id: "vol-multiattach",
      severity: "critical",
      title: "The disk is still attached to another node",
      why: "The volume is ReadWriteOnce, so it can attach to one node at a time. The old pod's node still holds it, which is common after a node failure or when a Deployment with a RWO volume rolls out a new pod on another node.",
      evidence: multi.slice(0, 2).map(ev),
      fixes: [
        "Wait for the old pod to finish terminating; the cloud detaches the disk after it is gone.",
        "For a Deployment with a RWO volume use strategy: Recreate, or use a StatefulSet.",
        "If the old node is dead, delete the stuck VolumeAttachment.",
      ],
      commands: [`kubectl get volumeattachment`, `kubectl get pods -A -o wide | grep <pvc-or-app-name>`],
    });
  }
  const mount = msgs(/FailedMount|FailedAttachVolume/).filter((e) => !/Multi-Attach|not found/.test(e.message));
  if (mount.length) {
    add({
      id: "vol-mount",
      severity: "critical",
      title: "A volume cannot be mounted",
      why: "The kubelet timed out attaching or mounting a volume, so the containers cannot start. Usual causes: the CSI driver is unhealthy, the disk is in another zone, or permissions on a cloud file share are wrong.",
      evidence: mount.slice(0, 2).map(ev),
      fixes: ["Check the PVC is Bound and the CSI driver pods on that node are running.", "Check the cloud console for the disk's attach status."],
      commands: [`kubectl get pvc${ns}`, `kubectl get pods -n kube-system -o wide | grep -i csi`],
    });
  }

  const startText = [...pod.containers.map((c) => `${c.stateReason ?? ""} ${c.lastReason ?? ""}`), ...pod.events.map((e) => e.message)].join(" ");
  if (/exec format error/.test(startText)) {
    add({
      id: "start-arch",
      severity: "critical",
      title: "The binary was built for a different CPU architecture",
      why: "'exec format error' means the entrypoint is for another architecture (an arm64 image on amd64 nodes or the reverse), or a script is missing its #! line.",
      evidence: [startText.match(/[^.]*exec format error[^.]*/)?.[0]?.trim() ?? "exec format error"],
      fixes: ["Rebuild with docker buildx --platform matching your nodes (check with kubectl get nodes -L kubernetes.io/arch).", "If it is a script, add #!/bin/sh as the first line."],
      commands: [`kubectl get nodes -L kubernetes.io/arch`],
    });
  }
  if (/executable file not found|no such file or directory: unknown|exec: "[^"]+": stat/.test(startText)) {
    add({
      id: "start-cmd",
      severity: "critical",
      title: "The container's command does not exist in the image",
      why: "The command or args in the pod spec (or the image's ENTRYPOINT) point to a file that is not in the image. Common with distroless or alpine images that have no bash.",
      evidence: [startText.match(/exec: "[^"]+"[^\n]*?(not found|no such file)[^.]*/)?.[0] ?? "executable file not found"],
      fixes: ["Check command/args in the spec against what is really in the image.", "Use sh instead of bash on alpine; distroless images have no shell at all."],
      commands: [`kubectl get pod ${p}${ns} -o jsonpath='{.spec.containers[*].command}{.spec.containers[*].args}'`],
    });
  }

  for (const c of pod.containers) {
    const crashing =
      has(c.stateReason, /^(CrashLoopBackOff|Error|OOMKilled)$/) ||
      c.lastState === "Terminated" ||
      (c.state === "Terminated" && c.exitCode !== undefined && c.exitCode !== 0) ||
      (c.restarts ?? 0) > 0;
    if (!crashing) continue;
    if (c.init && c.state === "Terminated" && c.exitCode === 0) continue; // finished init container
    const label = c.init ? `Init container "${c.name}"` : `Container "${c.name}"`;
    const logs = `kubectl logs ${p}${ns} -c ${c.name} --previous`;
    const evidence = [
      `${c.name}: State ${c.state ?? "?"}${c.stateReason ? ` (${c.stateReason})` : ""}, Last State ${c.lastState ?? "?"}${c.lastReason ? ` (${c.lastReason})` : ""}${c.exitCode !== undefined ? `, Exit Code ${c.exitCode}` : ""}, Restarts ${c.restarts ?? 0}`,
    ];
    if (c.lastReason === "OOMKilled" || c.stateReason === "OOMKilled") {
      add({
        id: `crash-oom-${c.name}`,
        severity: "critical",
        title: `${label} is running out of memory (OOMKilled)`,
        why: `The container used more memory than its limit${c.limits.memory ? ` of ${c.limits.memory}` : ""}, so the kernel killed it (exit 137). It will keep restarting until it fits. JVM, Node.js and Python apps often size their heap without looking at the container limit.`,
        evidence: [...evidence, c.limits.memory ? `memory limit: ${c.limits.memory}, request: ${c.requests.memory ?? "not set"}` : "no memory limit found in the paste"],
        fixes: [
          "Raise the memory limit above the real peak usage (with some headroom), and set the request close to normal usage.",
          "Tell the runtime about the limit: -XX:MaxRAMPercentage=75 for Java, --max-old-space-size for Node.js.",
          "If usage grows until it dies, look for a memory leak.",
        ],
        commands: [`kubectl top pod ${p}${ns} --containers`, logs],
      });
      continue;
    }
    const code = c.exitCode;
    if (code === 0 && !c.init) {
      add({
        id: `crash-exit0-${c.name}`,
        severity: "critical",
        title: `${label} exits successfully, and Kubernetes keeps restarting it`,
        why: EXIT[0][1] + " Typical causes: a script that runs and ends, a server started in the background (&), or a command that is meant for a Job.",
        evidence,
        fixes: [
          "Make the main process run in the foreground (for example nginx -g 'daemon off;').",
          "If it is a one-off task, run it as a Job or CronJob instead of a Deployment.",
        ],
        commands: [logs],
      });
      continue;
    }
    const known = code !== undefined ? EXIT[code] : undefined;
    const probeKill = pod.events.some((e) => /Liveness probe failed|failed liveness probe/.test(e.message));
    add({
      id: `crash-${c.name}`,
      severity: "critical",
      title: `${label} keeps crashing${known ? `: ${known[0]}` : code !== undefined ? ` (exit code ${code})` : ""}`,
      why:
        (known ? known[1] : "The container starts and then exits, so Kubernetes restarts it with a growing back-off (up to 5 minutes).") +
        (probeKill && (code === 137 || code === 143) ? " This pod also has liveness probe failures, which is the most likely reason it was killed." : "") +
        (c.init ? " Because it is an init container, the main containers will not start until it succeeds." : ""),
      evidence,
      fixes: [
        "Read the logs of the previous (crashed) run: the last lines usually name the error.",
        code === 127 || code === 126 ? "Check the command and args in the spec, and that the file exists and is executable in the image." : "Check environment variables, config files and that dependencies (database, other services) are reachable at startup.",
        probeKill ? "If the app is just slow to start, add a startupProbe or raise initialDelaySeconds on the liveness probe." : "Run the image locally with the same env to reproduce.",
      ],
      commands: [logs, `kubectl get pod ${p}${ns} -o jsonpath='{.status.containerStatuses[*].lastState}'`],
    });
  }

  const probe = (kind: "Liveness" | "Readiness" | "Startup") => {
    const evs = pod.events.filter((e) => new RegExp(`${kind} probe (failed|errored)`).test(e.message));
    if (!evs.length) return;
    const m = evs.map((e) => e.message).join(" ");
    let cause = "";
    let fix = "";
    if (/connection refused/.test(m)) {
      cause = "Nothing is listening on the probe's port. The app is not up yet, is listening on a different port, or is bound to 127.0.0.1 instead of 0.0.0.0.";
      fix = "Check the probe port matches the app's port, and that the app binds to 0.0.0.0.";
    } else if (/timeout|deadline exceeded|Client\.Timeout/.test(m)) {
      cause = "The health endpoint answered too slowly. The default timeoutSeconds is 1 second, which is easy to miss under load or during startup.";
      fix = "Raise timeoutSeconds, keep the health endpoint cheap (no database calls in liveness), and check CPU throttling.";
    } else if (/statuscode: (\d+)/.test(m)) {
      const sc = m.match(/statuscode: (\d+)/)![1];
      cause = `The health endpoint returned HTTP ${sc}. ${sc === "404" ? "The path is probably wrong." : sc.startsWith("5") ? "The app reports itself unhealthy, often because a dependency check inside the endpoint failed." : ""}`;
      fix = sc === "404" ? "Fix the probe path to an endpoint that exists." : "Check what the health endpoint checks; liveness should not depend on other services.";
    } else {
      cause = "The probe command or request failed.";
      fix = "Run the same check by hand inside the container.";
    }
    const def = pod.containers.map((c) => (kind === "Liveness" ? c.liveness : kind === "Readiness" ? c.readiness : c.startup)).filter(Boolean) as string[];
    const target = def[0]?.match(/http-get https?:\/\/[^:/]*:(\d+)(\/\S*)?/) ?? m.match(/https?:\/\/[^:/]+:(\d+)(\/[^"\s]*)?/);
    const port = target?.[1] ?? "<port>";
    const path = target?.[2] ?? "/";
    add({
      id: `probe-${kind}`,
      severity: kind === "Readiness" ? "warn" : "critical",
      title:
        kind === "Liveness"
          ? "Liveness probe failing: Kubernetes is restarting the container"
          : kind === "Readiness"
            ? "Readiness probe failing: the pod gets no traffic"
            : "Startup probe failing: the app does not start in time",
      why:
        (kind === "Liveness"
          ? "When liveness fails, the kubelet kills and restarts the container, even if the app was only slow. "
          : kind === "Readiness"
            ? "While readiness fails, the pod is removed from its Service endpoints, so requests skip it. It is not restarted. "
            : "Until the startup probe passes, the other probes are paused; if it keeps failing the container is restarted. ") + cause,
      evidence: [...evs.slice(0, 2).map(ev), ...def.map((d) => `${kind}: ${d}`)],
      fixes: [fix, kind === "Liveness" ? "For slow-starting apps, add a startupProbe so liveness only begins after startup." : "Test the endpoint from inside the pod (command below)."],
      commands: [`kubectl exec ${p}${ns} -- wget -qO- -T 2 http://localhost:${port}${path}`, `kubectl get endpoints <service>${ns}`],
    });
  };
  probe("Startup");
  probe("Liveness");
  probe("Readiness");

  if (pod.reason === "Evicted" || /The node was low on resource/.test(all)) {
    const res = all.match(/low on resource: ([\w-]+)/)?.[1] ?? "a resource";
    add({
      id: "evicted",
      severity: "critical",
      title: `Evicted: the node ran low on ${res}`,
      why:
        res === "ephemeral-storage"
          ? "The node's disk filled up and the kubelet evicted pods to free space. Large container logs, emptyDir volumes and images are the usual causes."
          : `The node ran low on ${res}, and the kubelet evicted pods, starting with those using the most above their requests.`,
      evidence: [pod.message ?? all.match(/[^\n]*low on resource[^\n]*/)?.[0] ?? ""],
      fixes:
        res === "ephemeral-storage"
          ? ["Set ephemeral-storage requests/limits, rotate logs, and put large data on a PVC instead of emptyDir."]
          : ["Set requests close to real usage so the scheduler does not overpack the node.", "Add capacity, or use larger nodes."],
      commands: [`kubectl get pods${ns} --field-selector status.phase=Failed`, `kubectl delete pods${ns} --field-selector status.phase=Failed`, `kubectl describe node ${pod.node ?? "<node>"} | grep -A6 Conditions`],
    });
  }

  const sandbox = msgs(/FailedCreatePodSandBox/);
  if (sandbox.length) {
    const m = sandbox.map((e) => e.message).join(" ");
    const ip = /failed to assign an IP address|no available IP|InsufficientFreeAddresses|ip addresses? (are )?exhausted/i.test(m);
    add({
      id: "sandbox",
      severity: "critical",
      title: ip ? "Stuck in ContainerCreating: the subnet is out of pod IPs" : "Stuck in ContainerCreating: the pod network could not be set up",
      why: ip
        ? "The CNI could not give the pod an IP address. On EKS with the VPC CNI and on AKS with Azure CNI, every pod takes a real subnet IP, so a small subnet runs out."
        : "The container runtime could not create the pod sandbox. Usually the CNI plugin on that node is not running or not configured yet.",
      evidence: sandbox.slice(0, 2).map(ev),
      fixes: ip
        ? ["Use a bigger subnet or add a secondary CIDR.", "On EKS, enable prefix delegation (ENABLE_PREFIX_DELEGATION=true); on AKS, consider Azure CNI Overlay."]
        : ["Check the CNI pods (aws-node, azure-cns, calico, cilium) on that node.", "If the node is new, give it a minute; otherwise cordon and replace it."],
      commands: [`kubectl get pods -n kube-system -o wide --field-selector spec.nodeName=${pod.node ?? "<node>"}`],
    });
  }

  if (/NodeNotReady|node\.kubernetes\.io\/(unreachable|not-ready)/.test(all) && !findings.some((f) => f.id === "sched-taint")) {
    add({
      id: "node",
      severity: "critical",
      title: "The node is not ready",
      why: "The node stopped reporting to the control plane. Pods on it are marked not ready and, after about 5 minutes, recreated elsewhere.",
      evidence: pod.events.filter((e) => /NodeNotReady/.test(e.reason)).slice(0, 2).map(ev),
      fixes: ["Check the node's conditions (memory, disk, PID pressure) and the kubelet.", "Cordon and replace the node if it does not recover."],
      commands: [`kubectl describe node ${pod.node ?? "<node>"} | grep -A10 Conditions`],
    });
  }

  const hook = msgs(/FailedPostStartHook|FailedPreStopHook/);
  if (hook.length) {
    add({
      id: "hook",
      severity: "warn",
      title: "A lifecycle hook failed",
      why: "A postStart hook failure kills the container; a preStop failure is logged and the pod is stopped anyway.",
      evidence: hook.slice(0, 2).map(ev),
      fixes: ["Run the hook command by hand in the container to see why it fails."],
      commands: [`kubectl get pod ${p}${ns} -o jsonpath='{.spec.containers[*].lifecycle}'`],
    });
  }

  const notReady = pod.containers.filter((c) => !c.init && c.state === "Running" && c.ready === false);
  if (notReady.length && !findings.some((f) => f.id.startsWith("probe-"))) {
    add({
      id: "notready",
      severity: "warn",
      title: `Running but not ready: ${notReady.map((c) => c.name).join(", ")}`,
      why: "The container is up, but its readiness probe is not passing, so it receives no Service traffic. The failure events may have expired (events are kept for about an hour).",
      evidence: notReady.map((c) => `${c.name}: Ready False${c.readiness ? ` · Readiness: ${c.readiness}` : ""}`),
      fixes: ["Call the readiness endpoint from inside the pod and check its response."],
      commands: [`kubectl exec ${p}${ns} -- wget -qO- -T 2 http://localhost:<port><path>`, `kubectl get events${ns} --field-selector involvedObject.name=${p}`],
    });
  }

  if (!findings.length && pod.status === "Pending" && !warn.length) {
    add({
      id: "pending-quiet",
      severity: "info",
      title: "Pending, with no warning events in the paste",
      why: "If the pod has a node, it is probably still pulling a large image or mounting volumes. If it has no node, the scheduling events may have expired (kept about an hour).",
      evidence: [`Node: ${pod.node ?? "<none>"}`],
      fixes: ["Wait a minute and describe again, or check the latest events."],
      commands: [`kubectl get events${ns} --field-selector involvedObject.name=${p} --sort-by=.lastTimestamp`],
    });
  }

  if (!findings.length && pod.status === "Running" && pod.containers.length && pod.containers.filter((c) => !c.init).every((c) => c.ready !== false)) {
    const restarts = pod.containers.reduce((n, c) => n + (c.restarts ?? 0), 0);
    add({
      id: "healthy",
      severity: "ok",
      title: "This pod looks healthy",
      why: `It is Running and every container is ready${restarts ? `, with ${restarts} restart(s) in the past` : ", with no restarts"}. If something is still wrong, the problem may be in the Service, Ingress or the app itself.`,
      evidence: pod.containers.map((c) => `${c.name}: ${c.state ?? "?"}, ready ${c.ready ?? "?"}, restarts ${c.restarts ?? 0}`),
      fixes: ["Check the Service selects this pod and has endpoints."],
      commands: [`kubectl get endpoints${ns}`, `kubectl logs ${p}${ns} --tail=50`],
    });
  }

  if (!findings.length) {
    add({
      id: "unknown",
      severity: "info",
      title: "No known problem found in this paste",
      why: "Pod Doctor reads the full output of kubectl describe pod (including the Events section at the bottom). Paste the whole thing, or the events for the pod.",
      evidence: [],
      fixes: ["Paste the complete describe output, from Name: to the end of Events:."],
      commands: [`kubectl describe pod ${p}${ns}`, `kubectl get events${ns} --field-selector involvedObject.name=${p} --sort-by=.lastTimestamp`],
    });
  }

  const order: Record<Severity, number> = { critical: 0, warn: 1, info: 2, ok: 3 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { pod, findings };
}

export function toMarkdown(pod: Pod, findings: Finding[]): string {
  const lines = [`## Pod Doctor report: ${pod.name ?? "pod"}${pod.namespace ? ` (${pod.namespace})` : ""}`, ""];
  for (const f of findings) {
    lines.push(`### [${f.severity.toUpperCase()}] ${f.title}`, "", f.why, "");
    if (f.evidence.length) lines.push("Evidence:", ...f.evidence.map((e) => `- \`${e}\``), "");
    if (f.fixes.length) lines.push("Fix:", ...f.fixes.map((x) => `- ${x}`), "");
    if (f.commands.length) lines.push("```bash", ...f.commands, "```", "");
  }
  lines.push("Generated with Pod Doctor: https://yohan.is-a.dev/tools/pod-doctor");
  return lines.join("\n");
}
