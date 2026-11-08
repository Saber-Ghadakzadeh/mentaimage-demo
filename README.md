# mentAImage PulseKey / NDMAPS — interactive demonstration

This is a browser-based demonstration built from an exported Figma Make React/TypeScript/Vite project. It includes the existing patient/practitioner/manufacturer experiences, restored practitioner **Inventory & Orders**, and a patient **Mobile / Desktop** layout switch. The Check-in Program Builder and NFH/VITAZAN Manufacturer Dashboard source components are preserved.

## GitHub Pages deployment (no Vercel or GCP)

GitHub repository: `mentAImage/pulsekey-ndmaps-demo`

Target URL (once deployed): **https://mentaimage.github.io/pulsekey-ndmaps-demo/**

1. An authorized mentAImage GitHub member creates a NEW repository named `pulsekey-ndmaps-demo` in the mentAImage organization. Use **Public** if your GitHub plan only supports Pages for public repos. Alternatively, private source may work if the organization's plan supports Pages for private repositories.
2. Unzip this archive. Run `publish-to-github.ps1` from the folder containing `package.json` (Git for Windows is required):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\publish-to-github.ps1 -RepositoryUrl https://github.com/mentAImage/pulsekey-ndmaps-demo.git
   ```
3. In the repository on GitHub open **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. In **Actions**, open **Deploy PulseKey / NDMAPS demo to GitHub Pages** and, if needed, select **Run workflow**. GitHub automatically deploys updates pushed to `main`.
5. Verify the URL above after the Actions deployment reports success.

No change to the existing `mentAImage/website` repository, its DNS, or Google Cloud resources is required.

## Developer setup

```bash
npm install
npm run dev
npm run build
```

Locally the demo runs at Vite's default localhost URL. On GitHub Pages, the production build uses the `/pulsekey-ndmaps-demo/` base path; the React Router basename matches it. `dist/404.html` enables direct deep links in the GitHub Pages environment.

## Demo-only safeguards

- All showcased patients, check-ins and transactions use **fictional demonstration data**. Do not upload real patient records or use this as a clinical system.
- The role selector is a **demo interface**, not real authentication or authorization.
- Changes may be stored only in the browser and **do not sync** across different visitors.
- Inventory orders and clinician messages are prototype interactions; they **do not** place real orders or contact healthcare professionals.
- GitHub Pages serves public web content; do not add secrets, API keys, protected patient data or production integrations.
- If the repository is public, the prototype's source code and fictional demo dataset are also public.

## Scope of changes

- Compared with the Figma Make export: Inventory & Orders is back in the practitioner navigation, and the patient area has a Mobile/Desktop switch.
- For GitHub Pages: only build configuration, SPA routing basename, 404 fallback and deployment workflow have been added; **the manufacturer and Check-in Program Builder source components were not modified**.
