# Mount Stewart, Morell, St. Peters Bay Pastoral Charge Website

**Goal**: Build a modern, content-managed website for the Mount Stewart, Morell, St. Peters Bay Pastoral Charge at ourchurchhome.ca using Astro with content collections.

## Tasks

- [ ] [Set up Astro project structure](intent://local/task/3679b62e-ad82-4492-ab04-097f0742ce3f)

- [ ] [Build homepage with Charge information](intent://local/task/c0e3565d-318f-4245-9ba8-3fc39a64f22f)

- [ ] [Create individual church pages](intent://local/task/879c639b-ede2-40a8-9517-6284497f070d)

- [ ] [Implement articles system with categories](intent://local/task/2822733a-ea3d-4996-92fa-53b075543c79)

- [ ] [Build volunteer schedule systems](intent://local/task/270dcbcc-4155-402f-a6ee-b970c9f1d170)

- [ ] [Add styling and responsive design](intent://local/task/ee33157a-f445-42c9-b98e-0919f5848b7f)

- [ ] [Configure deployment and domain](intent://local/task/e4670010-1dbd-4747-aec2-ea2379251e87)

## Acceptance Criteria

- [ ] Homepage displays Pastoral Charge information and lists all three churches
- [ ] Each church (Morell, Mount Stewart, St. Peters Bay) has a dedicated page
- [ ] Articles system supports creating announcements and informational updates with categories
- [ ] Articles can be filtered by category
- [ ] Each church has greeter, reader, and cleaner schedules accessible
- [ ] Schedules are sortable and show upcoming vs. past entries
- [ ] All content managed via Astro content collections (markdown files)
- [ ] Site is fully responsive on mobile, tablet, and desktop
- [ ] Site meets WCAG AA accessibility standards
- [ ] Site deployed to ourchurchhome.ca with HTTPS
- [ ] Build process is automated via CI/CD

## Non-goals

- User authentication or member login portal
- Online giving/donation processing
- Event calendar with RSVP
- Livestreaming integration
- Email newsletter subscription
- Search functionality
- Multi-language support
- Admin dashboard/CMS UI

## Assumptions

- Content will be managed by editing markdown files in the repository (confirm?)
- Volunteer schedules will be updated manually via markdown files (confirm?)
- No need for real-time updates or dynamic content
- Modern browser support only (last 2 versions)
- Static site hosting is acceptable

## Technical Decisions

- **Framework**: Astro with TypeScript
- **UI Components**: React (via Astro's React integration)
- **Content Management**: Astro Content Collections
- **Styling**: Tailwind CSS
- **Hosting**: TBD (recommend Netlify or Vercel for free tier + easy Astro integration)
- **Deployment**: Git-based continuous deployment

## Charge Information

**Name**: Mount Stewart, Morell, St. Peters Bay Pastoral Charge
**Domain**: ourchurchhome.ca

### Churches
1. **Morell United Church**
2. **Mount Stewart United Church**
3. **St. Peters Bay United Church**

Each church requires:
- Dedicated page with church-specific information
- Greeter schedule
- Reader schedule
- Cleaner schedule

## Verification Plan

1. **Content Collections Test**:
   ```bash
   # Create sample content in each collection
   # Verify schema validation works
   npm run build
   ```

2. **Navigation Test**: Verify all pages are accessible and links work

3. **Responsive Test**: Test at 375px, 768px, 1024px, 1920px widths

4. **Accessibility Audit**:
   ```bash
   # Run Lighthouse accessibility test
   # Verify WCAG AA compliance
   ```

5. **Build Test**:
   ```bash
   npm run build
   # Verify no build errors
   # Check dist/ output
   ```

6. **Deployment Test**: Verify site is accessible at ourchurchhome.ca with HTTPS

## Rollback Plan

- Keep previous content in version control
- Use git tags for releases
- Hosting platforms (Netlify/Vercel) provide instant rollback to previous deployments
- Domain DNS changes take 24-48hrs to propagate; maintain old site until new site verified