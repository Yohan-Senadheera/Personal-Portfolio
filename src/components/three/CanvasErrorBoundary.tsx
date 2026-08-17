import { Component, ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// React Three Fiber's <Canvas> throws (rather than rejecting a promise) when
// WebGL context creation fails — disabled GPU, driver crash, privacy browser,
// context loss under memory pressure. Suspense doesn't catch thrown errors,
// only pending promises, so without this boundary that failure unmounts the
// entire page instead of just the decorative background.
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("3D background failed to render, falling back:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
