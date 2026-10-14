import { Link } from "react-router-dom";
import "@/ops.css";

// The /i-love-you page. It is meant to look like a real access error.
export default function ILoveYou() {
  const reqId = "8f3c-" + Math.random().toString(16).slice(2, 10);
  return (
    <div className="ops-root ops-love">
      <div className="ops-love-in">
        <div className="ops-love-code">403</div>
        <h1>Forbidden</h1>
        <p className="lead">This page has been blocked by my girlfriend.</p>
        <pre className="ops-love-err">
{`$ kubectl get page i-love-you
Error from server (Forbidden): pages "i-love-you" is forbidden:
  User "visitor" cannot get resource "pages" in namespace "yohan".
  Access is restricted by ClusterRole "girlfriend-admin".
  Allowed subjects: 1 (and it is not you).

reason:     PolicyViolation
policy:     exclusive-relationship (enforce)
request-id: ${reqId}`}
        </pre>
        <p className="small">
          If you think this is a mistake, you are wrong. No appeals will be processed.
        </p>
        <Link to="/" className="ops-btn primary">
          ← back to safety
        </Link>
      </div>
    </div>
  );
}
