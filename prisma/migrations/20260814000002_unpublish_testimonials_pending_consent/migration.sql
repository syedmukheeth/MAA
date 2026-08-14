-- Unpublish every existing testimonial pending a consent record.
--
-- Published testimonials carry a real person's name, city and photograph. They
-- were entered by staff with no record that the person agreed to publication,
-- which under DPDP s6 means we cannot show the lawful basis for processing
-- them. Publication is one of the two things on this site that genuinely runs
-- on consent (the other is marketing email).
--
-- This is reversible per row, not in bulk: staff re-publish from
-- /admin/testimonials once they have linked the customer and recorded consent
-- (see docs/privacy/06-consent-and-testimonials.md for the contact procedure
-- and the query listing what needs chasing).
--
-- Expected side effect: the homepage testimonial section renders empty until
-- consent is collected. That is the intended behaviour of the model — see the
-- doc-comment on Testimonial in schema.prisma. An empty trust block is honest.

UPDATE "Testimonial"
SET "isPublished" = false,
    "updatedAt"   = CURRENT_TIMESTAMP
WHERE "isPublished" = true;
