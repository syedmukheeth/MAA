# Updates 01

Bugs and UI issues noticed

## Manager/Admin UI

- Fix manager/admin dashboard mobile layout: the page should be fully dark/black with no white empty space on the right side.
- Ensure admin/manager dashboard content does not overflow horizontally on mobile.
- Keep the top bar/header visible consistently on all pages, not only after scrolling down.
- Add a clearly visible mandatory `Visit Store` option for manager/admin/owner users.
- Add a logout option for every role: owner, admin, manager, and customer.

## Navigation Active State

- Highlight the current page in navigation for everyone: owner, admin, manager, and customer.
- Sidebar/mobile navigation should show the active page permanently, not only on hover.

## Store/Home UI

- Fix the orange/bronze text color on the hero area because it is too faint and not visible enough on mobile.
- Check navbar visibility when moving between pages; it should remain visible and usable without requiring scroll.
- Product/store pages should show the full navigation/header correctly, not only the logo.

## Auth/Login

- Add a loading state or loading bar when logging in/signing in.
- Show a clear error message when the password is incorrect or login fails.
- Make login feedback visible near the form, not hidden or silent.

## Product Page / Images

- Check product listing images: one product appears to show an unrelated garden/path image, so product images should be reviewed and corrected.



## Additional Notes From Craftsmanship Screenshot

- Show visible loading feedback when moving between different options/pages, not only during login.
- Review the Craftsmanship section interaction: on mobile, slides should support horizontal swipe/drag navigation if they are presented like a carousel, instead of only changing when scrolling vertically.
- Make the Craftsmanship slide controls/progress easier to understand and interact with on mobile.
