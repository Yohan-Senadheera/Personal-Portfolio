# yohan.is-a.dev

The portfolio of **Yohan Senadheera**, Site Reliability and DevOps engineer. One day in Colombo becomes a scroll story: a drone shot over the city, then the work behind it — pull-based CI/CD, certificate automation, open source and PageRewind.

**Live:** [yohan.is-a.dev](https://yohan.is-a.dev) · **Classic version:** [yohan.is-a.dev/classic](https://yohan.is-a.dev/classic)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yohan-senadheera)
[![Medium](https://img.shields.io/badge/Medium-000000?style=flat-square&logo=medium&logoColor=white)](https://medium.com/@yohansenadheera)
[![Email](https://img.shields.io/badge/Email-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:yohansenadheera@gmail.com)

## What's on the site

| Chapter | What it shows |
|---|---|
| Cover | Who I am and that I'm available now |
| All systems green | A status dashboard of shipped work: 20+ services on CA-signed certificates, 50+ inline secrets removed, zero inbound connections, open-source contributions |
| WSO2 | The pull-based CI/CD design: production clusters pull their own deploys over mTLS, so nothing reaches in |
| Projects | Projects as a live cluster of pods, with `kubectl describe` details |
| Open source | Pull requests to Argo Workflows, the Kubernetes Python client, Prometheus, OpenChoreo and WSO2's Terraform modules, with their status |
| Experience | An on-call rotation chart of roles and milestones |
| Toolbox | Skills I've used in real work |
| Contact | Email, CV and links |

## How it's built

- **React 18 + TypeScript + Vite**, styled with Tailwind CSS
- **React Three Fiber / three.js** for the scroll scene: a custom GLSL shader blends photos and video clips with a page-turn transition, depth-based parallax and a scroll-driven blur
- **Lenis** smooth scrolling; text and camera follow one scroll timeline
- Falls back to still photos when autoplay is blocked, and to a stacked layout on phones
- Hosted on **Cloudflare Pages**, on an [is-a.dev](https://is-a.dev) subdomain
- SEO: Open Graph preview image, `Person` structured data, sitemap, and long-lived caching for hashed assets

```
src/
  pages/Journey.tsx               the scroll story (route /)
  pages/Index.tsx                 the classic portfolio (route /classic)
  components/journey/PhotoScene   WebGL photo and video scene
  components/journey/Night        dashboard, diagram, skills and PR feed
  components/journey/Interactive  projects board and on-call rotation
public/
  media/web/                      photos and clips
  _headers, robots.txt, sitemap.xml
```

## Run locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # production build in dist/
npm run preview    # serve the build
```

Add `?calm` to the URL for reduced motion.

## Deploy

Pushing to `main` deploys to Cloudflare Pages.
