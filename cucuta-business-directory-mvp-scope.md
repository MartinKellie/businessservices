# Cúcuta Local Business Directory — MVP Scope

## 1. Project Overview

Create a Spanish-language local business and services directory focused initially on Cúcuta and nearby areas.

The product helps local consumers answer a simple question:

> “I live in this area and I’m looking for this product or service — where can I find it?”

The directory is intended particularly for businesses that may have little or no online presence.

The public platform will have its own local identity and will carry a discreet **“Powered by MK1GROUP”** attribution.

The MVP is a responsive web application. It is designed for direct/local use rather than search-engine discovery.

---

## 2. Primary User Goal

A consumer should be able to:

1. Select or use their current area/community.
2. Search for a product, service, business or category.
3. See relevant businesses on a map and in result cards.
4. Understand where each business is located.
5. See whether it is currently open when opening-hours data is available.
6. Contact the business directly, particularly through WhatsApp or phone.
7. Filter the results to narrow the search.

No consumer account is required.

---

## 3. Launch Geography

The directory is Cúcuta-first but may include nearby areas from launch, including places such as:

- Cúcuta
- Los Patios
- Villa del Rosario
- Other nearby communities where relevant

The public brand should remain Cúcuta-focused for the MVP.

The location model should support multiple areas/communities rather than assuming the whole platform is one undifferentiated city.

---

## 4. Public Language

### Public directory
- Spanish only for MVP.

### Admin/internal dashboard
- Bilingual:
  - Spanish
  - English

This is required because MK1GROUP and local collaborators will both use the admin system.

---

## 5. Public Homepage

The homepage should feel like a local directory, but search should remain the dominant action.

Core elements:

- “What are you looking for?” search field.
- Area/community selector.
- “Near me” option.
- Popular/browsable categories.
- Homepage announcement/banner.
- Link to About.
- Link to Advertise with us.
- Public contact route.
- “Powered by MK1GROUP”.

The homepage should remain neutral in the MVP.

There should be no featured businesses on the homepage at launch.

---

## 6. Search Model

Search is one of the core features of the product.

Users should be able to search by:

- Business name.
- Category.
- Product.
- Service.
- Structured search term.
- Synonym/alias.
- Common spelling variation.
- Reasonable misspelling.

Search should support:

- Spanish accents.
- Singular/plural variation.
- Fuzzy matching where practical.
- Spanish synonyms.
- Local/colloquial terminology.

Search should not depend only on business names.

Example use case:

> “I live in [community] and I’m looking for a water cooler unit.”

---

## 7. Products and Services Taxonomy

Products and services should be structured shared concepts rather than arbitrary free-text tags.

Example:

- “Water coolers” exists as one shared concept.
- Multiple businesses can be linked to that same concept.
- Synonyms can be attached to that concept.

Rules:

- Products/services are reusable across businesses.
- Businesses can link to multiple products/services.
- Product/service concepts are controlled entries.
- Free text should not automatically create new searchable concepts.
- Local Editors can request new concepts.
- Owner/Admin approval is required initially.
- The approval requirement can be switched off in System Settings.

---

## 8. Categories

Businesses can belong to more than one category.

Rules:

- One category may be marked as the primary category.
- Secondary categories can also be assigned.
- Categories are structured and reusable.
- Local Editors can request new categories.
- Owner/Admin approval is required initially.
- Approval can later be disabled through System Settings.

---

## 9. Synonyms and Aliases

The MVP should support synonyms and local terminology.

Example concepts might include different words used locally for the same product or service.

Rules:

- Global synonyms should be supported.
- Where needed, synonyms may be scoped to a specific product/service concept or category.
- Synonyms should not be managed independently per business.
- Local Editors can request new synonyms.
- Owner/Admin approval is required initially.
- Approval can later be disabled through System Settings.

---

## 10. Location and Map Behaviour

The map is a core part of the product.

### Physical businesses

Use the most precise verified location available:

- Exact street address where possible.
- Map coordinates/pin.
- Closest reliable location where exact details are unavailable.

### Mobile/service businesses

For businesses such as plumbers, mobile mechanics or other services without a public shopfront:

- Show service area/community rather than a private home address.
- Allow that service area to be updated later.

### “Near me”

The MVP should support optional device location.

Behaviour:

- User grants location permission.
- Search shows the closest relevant businesses within a fixed radius.
- The radius is set globally in System Settings.
- Users cannot change the radius in the MVP.
- If location permission is denied, fall back to the manually selected area/community.

---

## 11. Remembered User Preferences

No account is required.

The browser/device should remember:

- Selected community/area.
- Desktop map/results split position.
- Desktop collapsed/expanded pane state.
- Mobile Map/List preference.
- Light/dark theme preference.

These preferences should be stored locally on the device.

---

## 12. Desktop Results Experience

Desktop should display:

- Map.
- Result list.

Both remain visible by default.

Behaviour:

- Divider between map and list is draggable.
- Either pane can be collapsed.
- User preference is remembered locally.
- Selecting a result card highlights the matching map pin.
- Selecting a map pin focuses the matching result card.

The result detail experience should remain within the search/map screen rather than navigating to a separate business page.

---

## 13. Mobile Results Experience

Mobile should support:

- Map view.
- List view.
- Quick switching between them.

The user’s last-used view should be remembered locally.

When viewing a business from the map:

- Use a bottom sheet/detail panel.
- The panel can expand.
- The map remains visible where practical.

No dedicated business detail page is required in the MVP.

---

## 14. Result Filters

The MVP should include filters.

Initial filters may include:

- Open now.
- Category.
- Area/distance context.
- WhatsApp available.

No manual sort controls are required in the MVP.

The default ranking should be sensible enough that sorting is not necessary.

---

## 15. Search Ranking

Exact paid-placement behaviour remains unresolved.

Preferred direction:

- Main ranking based on relevance and location.
- Temporarily closed businesses rank below comparable active businesses.
- Any future paid/featured positioning should not destroy relevance or user trust.
- Sponsored/featured positioning, if introduced later, should be clearly identifiable.

---

## 16. Business Result Cards

The MVP uses cards rather than dedicated public business pages.

A card may show:

- Business name.
- Primary category.
- Additional categories where useful.
- Area/community.
- Logo or business photo.
- Category fallback image/icon if neither exists.
- Opening status if hours are known.
- Phone number.
- WhatsApp.
- Email.
- Website.
- Instagram.
- Facebook.
- Business status.

The full address should appear after the user opens/expands the card or interacts with the map pin.

Service businesses should show their service area rather than private residential details.

No business description is required in the MVP.

No prices are required in the MVP.

No offers/promotions are required in the MVP.

---

## 17. Images and Logos

Logo and photos are separate fields.

A business may have:

- Logo.
- Photo(s).

If no business media exists:

- Use a category-based fallback image/icon.

The exact free/paid image allowance is not finalised.

Current likely direction:

- Free listing has limited media.
- Paid tiers may later allow additional images/gallery features.

Business-submitted images must be reviewed by an admin before publication.

Uploads should have:

- Maximum file size.
- Restricted accepted image types.
- Exact limits to be chosen later.

---

## 18. Opening Hours

Opening hours are supported but optional.

Rules:

- A listing can be published without hours.
- Unknown hours should not block publication.
- Admin can enter hours when available.
- Claimed/managed businesses may maintain their own hours in a later version.

The underlying concept should allow for business-wide hours and eventual location-specific overrides, although the public MVP only supports one active location per business.

---

## 19. Business Status

Supported statuses:

- Draft.
- Published/Active.
- Temporarily closed.
- Permanently closed.
- Relocated.
- Deleted/Archived.

### Temporarily closed

- Remains visible in normal search.
- Clearly labelled as temporarily closed.
- Should rank below similar active businesses.

### Permanently closed

- Does not appear in normal product/service/category discovery.
- Can remain findable by business name or historical/location context.

### Relocated

- Old location may remain visible as “Moved”.
- Active business points to the new location.
- If another business later takes over the old premises, the former association can be archived from normal public view.

### Deleted

- Soft-delete only in the MVP.
- Records are retained internally.
- Deleted records disappear from normal public use.

---

## 20. Business and Premises Model

The product concept should distinguish:

- The business itself.
- Its premises/location.

This allows for future cases such as:

- Business relocation.
- New business taking over the old premises.
- Historical location context.

The MVP supports one active location per business.

Multi-location support is deferred.

---

## 21. Free and Paid Listing Model

Exact pricing remains undecided and should be validated locally.

Likely direction:

### Free/basic
- Business presence in directory.
- Core contact details.
- Category.
- Products/services.
- Location/service area.
- Limited image/logo allowance.
- Opening hours where available.

### Paid/upgraded
Potential future features:

- More photos.
- Greater listing control.
- Enhanced presentation.
- Featured visibility.
- Promotions/offers.
- Analytics.
- Self-management.
- Dedicated richer business page.

The MVP does not include online payments.

Paid upgrades are handled manually by MK1GROUP.

---

## 22. Business Onboarding and Claiming

MK1GROUP will seed the directory manually.

Initial business information may come from:

- Manual research.
- Phone calls.
- Shop visits.
- Local contacts.
- Publicly available business information.

The first approximately 50 businesses may be manually verified more thoroughly.

No self-service “claim this business” workflow is required in the MVP.

Businesses can instead contact MK1GROUP to:

- Be added.
- Request an update.
- Ask about advertising.
- Ask about enhanced listing options.

---

## 23. Verification

Verification is internal only in the MVP.

Potential internal confidence levels include:

- Researched.
- Contacted.
- Phone-verified.
- Visited.
- Business-claimed.

These levels are not shown publicly.

The business record should store:

- Verification status/level.
- Verification method.
- Last verified date.
- Source of information where useful.

### High-risk changes

Changes to fields such as:

- Phone.
- WhatsApp.
- Email.
- Website.
- Ownership/claim details.

require stronger manual verification.

One strong verification method is sufficient for MVP.

Business email domains may be useful but must not be required, because many target businesses may only use free email providers or WhatsApp.

---

## 24. Last Updated / Last Verified

### Internal
Always retain:

- Created date.
- Updated date.
- Last verified date.

Admin dashboard should be sortable/filterable by last verified date.

### Public
A global System Settings toggle controls whether “Last updated” is shown publicly.

No per-business override is needed in MVP.

---

## 25. Admin Dashboard

A proper admin dashboard is part of the MVP.

The dashboard is bilingual Spanish/English.

Core capabilities:

- Global search.
- Create businesses.
- Edit businesses.
- Save drafts.
- Publish businesses.
- Manage status.
- Manage categories.
- Manage products/services.
- Manage synonyms/aliases.
- Manage location and map data.
- Manage logo/photos.
- Manage opening hours.
- Manage verification information.
- Manage internal notes.
- Manage contact history.
- Manage follow-up dates.
- View due/overdue follow-ups.
- Manage enquiries.
- Import business data.
- Export business data.
- Access System Settings.

---

## 26. Admin Roles

At least two roles are required.

### Owner/Admin

Full control, including:

- User/role management.
- System Settings.
- Taxonomy approvals.
- Category approvals.
- Product/service approvals.
- Synonym approvals.
- Imports/exports.
- Higher-risk destructive/archive actions.
- Other structural controls.

### Local Editor

Can:

- Create listings.
- Edit listings.
- Publish listings.
- Add business information.
- Manage photos.
- Manage hours.
- Update contact details subject to verification rules.
- Add admin notes.
- Add contact-history entries.
- Set follow-up dates.
- Manage day-to-day directory content.

Local Editor can request new taxonomy entries but approval is required initially.

---

## 27. Admin Authentication

MVP admin authentication:

- Google sign-in.
- `/admin` route.
- Access restricted to a fixed allow-list.
- Initial allow-list: three approved Google accounts.
- Actual accounts to be supplied later.

Public users do not need accounts.

---

## 28. Draft Listings

Drafts are supported.

### Minimum draft data

Provisional minimum:

- Business name.
- Category.
- Area/community.
- At least one contact method or internal source note.

### Publish minimum

Provisional minimum:

- Business name.
- Category.
- Area/community.
- Public contact method.
- Address or service area.
- At least one searchable product/service/tag/concept.

Exact validation rules may be refined during implementation.

---

## 29. Internal Notes and Contact History

Each business can have internal notes.

Examples:

- Owner prefers WhatsApp.
- Needs re-checking.
- Visited on a specific date.
- Verification comments.

Notes are never public.

Each business also has lightweight contact history.

Each contact-history entry should include:

- Date.
- Contact method.
- Short outcome/note.

This is not intended to become a full CRM.

---

## 30. Follow-Ups

Each business may have a follow-up/reminder date.

Dashboard should show:

- Due follow-ups.
- Overdue follow-ups.

No email, push or WhatsApp follow-up notifications are required in the MVP.

Dashboard visibility is sufficient.

---

## 31. Import and Export

Admin should support:

### Import
- CSV.
- Excel.

Imported records should be reviewable before publication.

### Export
- CSV.
- Excel.

Useful for:

- Offline review.
- Backup copies.
- Bulk editing.
- Handover.

Import/export must not bypass normal validation rules.

---

## 32. Search Preview in Admin

Admin should include a simple search-preview capability.

Purpose:

- Check whether a business appears for expected products/services/keywords.
- Identify weak or missing tagging before publication.

---

## 33. Public Contact System

The preferred public contact route is a website form.

The form should support enquiry types including:

- Add my business.
- Update my listing.
- Advertising enquiry.
- General enquiry.

Submissions should:

- Be stored in the admin dashboard.
- Trigger an admin notification.
- Enter one shared queue.

No assignment to individual admins is required.

---

## 34. Enquiry Status

Simple statuses:

- New.
- In progress.
- Closed.

Enquiry type should also be visible and filterable.

This is not a full ticketing system.

---

## 35. Contact Form Uploads

Business-related contact submissions may include a logo/photo upload.

Rules:

- File size is capped.
- Accepted file formats are restricted.
- Uploaded images require admin review.
- Uploaded images are not automatically published.

---

## 36. Spam Protection

Spam protection is required.

Preferred low-friction measures:

- Server-side validation.
- Rate limiting.
- Honeypot fields.

CAPTCHA should only be introduced if real spam levels justify it.

---

## 37. Enquiry Retention

Enquiries should not be stored indefinitely.

Requirements:

- Configurable retention period in months.
- At retention expiry, enquiry is soft-deleted.
- Short configurable grace period.
- After grace period, enquiry is permanently removed.

Exact durations remain to be decided.

### Uploaded-image retention

Still unresolved.

Likely future rule:

- If an uploaded image becomes approved business media, it becomes part of the business record.
- Otherwise it may follow the enquiry retention lifecycle.

Storage usage should be considered before finalising this rule.

---

## 38. System Settings

Owner/Admin should have a System Settings panel.

Initial settings include:

- Approval required for new categories.
- Approval required for new products/services.
- Approval required for new synonyms/aliases.
- Public “Last updated” visibility.
- Fixed “Near me” search radius.
- Maintenance Mode.
- Homepage announcement/banner on/off.
- Homepage announcement text.
- Enquiry retention period.
- Enquiry deletion grace period.

Commercial tier configuration is deferred.

---

## 39. Maintenance Mode

MVP includes Maintenance Mode.

Behaviour:

- Owner/Admin can enable it.
- Public site becomes unavailable.
- `/admin` remains accessible.
- Public users see a fixed Spanish maintenance message.

The maintenance message is not editable in MVP.

---

## 40. Homepage Announcement Banner

MVP includes a simple announcement banner.

Requirements:

- Owner/Admin can enable/disable it.
- Banner text is editable.
- Fixed placement.
- Text only.
- No link/button required in MVP.

Initial use case may be launch/“Coming soon” messaging.

---

## 41. Advertise With Us

MVP includes a business-facing “Advertise with us” section/page.

It should explain:

- How businesses can be included.
- That enhanced options are available.
- How to contact MK1GROUP.
- That upgrades are handled manually initially.

A direct WhatsApp/contact route may also be offered.

---

## 42. About Page

MVP includes an About page.

It should explain:

- What the directory is.
- Who it is for.
- That it is Powered by MK1GROUP.

Internal research and verification processes should not be described publicly in the MVP.

---

## 43. Legal / Privacy Pages

MVP includes:

- Privacy Policy.
- Terms / Disclaimer.
- Cookie notice/banner.
- Simple cookie preferences panel.

Privacy/terms should cover:

- Public contact-form data.
- Admin authentication.
- Optional device location.
- Local preference storage.
- Business information accuracy.
- Third-party links/contact methods.

Public contact form should include a required Privacy Policy consent checkbox.

Consent state should be stored with the enquiry.

---

## 44. Theme

Both public site and admin dashboard support:

- Light mode.
- Dark mode.

Behaviour:

- Default follows device/system preference.
- User can manually override.
- Manual preference is remembered locally.

---

## 45. Out of Scope for MVP

The following are deliberately excluded from MVP:

- Consumer accounts.
- Reviews and ratings.
- Live stock tracking.
- Online payments.
- Self-service business claiming.
- Self-service business account management.
- Voice search.
- Promotional offers/deals.
- Product/service pricing.
- Business descriptions.
- Dedicated public business profile pages.
- Directions button/map-app hand-off.
- User-submitted “suggest a business” feature.
- Formal analytics/product-usage dashboard.
- Featured businesses on homepage.
- Manual result sorting.
- Multi-location businesses.
- PWA/native-style installability.
- Formal SEO workstream.
- Full accessibility compliance workstream.
- Detailed audit/change history.
- Automated follow-up notifications.
- Custom backup/restore UI.
- Full CRM/ticketing system.
- Commercial listing-tier settings panel.

---

## 46. Future Features / Post-MVP Candidates

Likely later additions include:

- Voice search.
- SEO/indexable business pages.
- Business self-management.
- Claim-this-business workflow.
- Online payments.
- Richer paid listing tiers.
- Multiple photos/gallery.
- Featured placements.
- Offers/promotions.
- Analytics.
- Reviews.
- Directions.
- Multi-location business support.
- Consumer favourites.
- PWA/mobile-app experience.
- Richer business profile pages.
- Better accessibility compliance.
- Voice-based search and discovery.

---

## 47. Important Unresolved Items

These do not block MVP scoping but require later decisions:

1. Exact domain/brand name.
2. Exact free vs paid listing model.
3. Exact pricing.
4. Exact fixed “Near me” radius.
5. Exact ranking treatment for future paid/featured listings.
6. Exact image size limits.
7. Exact enquiry retention period.
8. Exact enquiry deletion grace period.
9. Enquiry-uploaded image retention rules.
10. Final three approved Google admin accounts.
11. Final wording of Spanish public copy/legal content.
12. Exact publish-validation rules if experience suggests adjustments.

---

## 48. MVP Success Definition

The MVP is successful when a local user can:

1. Open the site without creating an account.
2. Tell the directory where they are.
3. Search for something they need.
4. Get useful nearby business/service results.
5. See those results clearly on a map and in cards.
6. Filter them.
7. Understand whether the business is active/open where information exists.
8. Contact the business easily.

And MK1GROUP/local editors can:

1. Add and maintain businesses efficiently.
2. Keep search taxonomy structured.
3. Manage verification and contact history.
4. Manage enquiries.
5. Keep the directory accurate enough to remain useful.
6. Operate the system without needing to edit the underlying data directly.
