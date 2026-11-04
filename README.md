# Ideal Public School Community

An Apple-inspired, responsive, static community guide. This is an **independent, unofficial project** and is not affiliated with, authorized by, operated by, or endorsed by Ideal Public School.

## Stack and data
- Plain HTML, CSS and JavaScript; no framework build step.
- No external database, backend, analytics SDK or account system.
- Community notes use browser `localStorage` and remain on the same browser/device only.
- External Google Fonts are used for typography; all site application assets are local.

## Run locally
Open `index.html` or run `python -m http.server 8000` and visit `http://localhost:8000`.

## SEO implementation
- Self-referencing canonical, descriptive title and meta description.
- Open Graph and Twitter metadata with image alt text.
- JSON-LD graph for the independent publisher, website and page. Public campus addresses are represented as mentioned Place references, not as the community project's own address.
- `robots.txt`, XML sitemap, and `llms.txt`.
- Vercel security headers, semantic HTML, mobile viewport, reduced-motion support and crawlable HTML content.
- No fake ratings, reviews, FAQ rich-result markup, or unsupported claims of official affiliation.

## Address and identity policy
The project has no asserted physical office address. The Kulgachia, Shyampur and Amta locations are campus references published by the school, not the project's registered address or headquarters.

## Before launch
1. Verify campus addresses, phone numbers and official links against the school's current pages.
2. Replace the default Vercel hostname in canonical, Open Graph, Twitter, JSON-LD, sitemap and `llms.txt` if a custom domain is configured.
3. Test the live sitemap and robots file, then add the verified domain to Google Search Console and submit the sitemap.
4. Run Lighthouse / PageSpeed and Google's Rich Results Test after deployment. Search rankings cannot be guaranteed.
