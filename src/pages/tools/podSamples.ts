export const POD_SAMPLES: { label: string; text: string }[] = [
  {
    label: "CrashLoopBackOff (OOM)",
    text: `Name:             orders-api-7d9f8b6c5-x2kqp
Namespace:        shop
Priority:         0
Service Account:  orders-api
Node:             aks-user-31415926-vmss000002/10.224.0.6
Start Time:       Mon, 23 Nov 2026 09:12:44 +0530
Labels:           app=orders-api
Status:           Running
IP:               10.244.2.17
Controlled By:    ReplicaSet/orders-api-7d9f8b6c5
Containers:
  orders-api:
    Container ID:   containerd://4b1f0c2e9a7d
    Image:          ghcr.io/acme/orders-api:1.8.2
    Port:           8080/TCP
    State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Mon, 23 Nov 2026 09:31:02 +0530
      Finished:     Mon, 23 Nov 2026 09:31:40 +0530
    Ready:          False
    Restart Count:  7
    Limits:
      cpu:     500m
      memory:  256Mi
    Requests:
      cpu:        250m
      memory:     256Mi
    Liveness:     http-get http://:8080/healthz delay=10s timeout=1s period=10s #success=1 #failure=3
    Readiness:    http-get http://:8080/ready delay=5s timeout=1s period=5s #success=1 #failure=3
Conditions:
  Type              Status
  Ready             False
  ContainersReady   False
Events:
  Type     Reason     Age                  From               Message
  ----     ------     ----                 ----               -------
  Normal   Scheduled  20m                  default-scheduler  Successfully assigned shop/orders-api-7d9f8b6c5-x2kqp to aks-user-31415926-vmss000002
  Normal   Pulled     6m (x8 over 20m)     kubelet            Container image "ghcr.io/acme/orders-api:1.8.2" already present on machine
  Normal   Started    6m (x8 over 20m)     kubelet            Started container orders-api
  Warning  BackOff    90s (x60 over 19m)   kubelet            Back-off restarting failed container orders-api in pod orders-api-7d9f8b6c5-x2kqp_shop`,
  },
  {
    label: "Pending (no capacity)",
    text: `Name:             reports-worker-5c8d7f9b4-mm2lt
Namespace:        analytics
Priority:         0
Node:             <none>
Labels:           app=reports-worker
Status:           Pending
IP:
Controlled By:    ReplicaSet/reports-worker-5c8d7f9b4
Containers:
  worker:
    Image:      acme.azurecr.io/reports-worker:2.3.0
    Port:       <none>
    Limits:
      cpu:     4
      memory:  8Gi
    Requests:
      cpu:        4
      memory:     8Gi
Conditions:
  Type           Status
  PodScheduled   False
Events:
  Type     Reason            Age                 From               Message
  ----     ------            ----                ----               -------
  Warning  FailedScheduling  2m (x14 over 15m)   default-scheduler  0/4 nodes are available: 1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: }, 3 Insufficient cpu. preemption: 0/4 nodes are available: 1 Preemption is not helpful for scheduling, 3 No preemption victims found for incoming pod.`,
  },
  {
    label: "ImagePullBackOff",
    text: `Name:             web-6b7c9d8f5-q8zrt
Namespace:        default
Node:             ip-10-0-2-41.ec2.internal/10.0.2.41
Status:           Pending
Containers:
  web:
    Image:          123456789012.dkr.ecr.us-east-1.amazonaws.com/web:v2.1.0
    Port:           80/TCP
    State:          Waiting
      Reason:       ImagePullBackOff
    Ready:          False
    Restart Count:  0
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  3m                 default-scheduler  Successfully assigned default/web-6b7c9d8f5-q8zrt to ip-10-0-2-41.ec2.internal
  Normal   Pulling    2m (x4 over 3m)    kubelet            Pulling image "123456789012.dkr.ecr.us-east-1.amazonaws.com/web:v2.1.0"
  Warning  Failed     2m (x4 over 3m)    kubelet            Failed to pull image "123456789012.dkr.ecr.us-east-1.amazonaws.com/web:v2.1.0": rpc error: code = NotFound desc = failed to pull and unpack image "123456789012.dkr.ecr.us-east-1.amazonaws.com/web:v2.1.0": not found
  Warning  Failed     2m (x4 over 3m)    kubelet            Error: ErrImagePull
  Warning  Failed     60s (x6 over 3m)   kubelet            Error: ImagePullBackOff
  Normal   BackOff    45s (x7 over 3m)   kubelet            Back-off pulling image "123456789012.dkr.ecr.us-east-1.amazonaws.com/web:v2.1.0"`,
  },
  {
    label: "Missing Secret",
    text: `Name:             payments-5f6d8c7b9-k4vxs
Namespace:        payments
Node:             aks-system-27182818-vmss000001/10.224.0.4
Status:           Pending
Containers:
  payments:
    Image:          acme.azurecr.io/payments:3.0.1
    State:          Waiting
      Reason:       CreateContainerConfigError
    Ready:          False
    Restart Count:  0
    Environment:
      DB_PASSWORD:  <set to the key 'password' in secret 'payments-db'>  Optional: false
Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  2m                 default-scheduler  Successfully assigned payments/payments-5f6d8c7b9-k4vxs to aks-system-27182818-vmss000001
  Normal   Pulled     10s (x9 over 2m)   kubelet            Container image "acme.azurecr.io/payments:3.0.1" already present on machine
  Warning  Failed     10s (x9 over 2m)   kubelet            Error: secret "payments-db" not found`,
  },
  {
    label: "Liveness probe failing",
    text: `Name:             search-8c6f7d5b4-p9wlq
Namespace:        search
Node:             ip-10-0-1-12.ec2.internal/10.0.1.12
Status:           Running
Containers:
  search:
    Image:          ghcr.io/acme/search:4.2.0
    Port:           9200/TCP
    State:          Running
      Started:      Mon, 23 Nov 2026 10:02:11 +0530
    Last State:     Terminated
      Reason:       Error
      Exit Code:    143
    Ready:          False
    Restart Count:  4
    Liveness:       http-get http://:9200/health delay=0s timeout=1s period=10s #success=1 #failure=3
    Readiness:      http-get http://:9200/ready delay=0s timeout=1s period=5s #success=1 #failure=3
Events:
  Type     Reason     Age                 From     Message
  ----     ------     ----                ----     -------
  Warning  Unhealthy  40s (x12 over 6m)   kubelet  Liveness probe failed: Get "http://10.0.1.87:9200/health": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
  Warning  Unhealthy  35s (x30 over 6m)   kubelet  Readiness probe failed: Get "http://10.0.1.87:9200/ready": dial tcp 10.0.1.87:9200: connect: connection refused
  Normal   Killing    40s (x4 over 6m)    kubelet  Container search failed liveness probe, will be restarted`,
  },
];
