-- Seed data for job_categories — run AFTER docs/seo/jobs-migration.sql.
-- Full taxonomy from the Jobs section spec: 24 parents, ~158 children —
-- not a 5-10-item placeholder list. Admins can add/edit/delete/reorder/
-- deactivate from here on via /admin/job-categories; this is just the
-- starting seed.
--
-- Two names are legitimately reused under different parents ("Business
-- Development" under both Business & Management and Sales & Customer
-- Service; "Architecture" under both Engineering and Construction & Real
-- Estate) — each gets a distinct slug since job_categories.slug is
-- globally unique, while keeping the same display name.

begin;

-- ---------------------------------------------------------------
-- Parents
-- ---------------------------------------------------------------
insert into public.job_categories (name, slug, icon, sort_order) values
  ('Technology & IT', 'technology-it', '💻', 1),
  ('Digital Marketing & SEO', 'digital-marketing-seo', '📈', 2),
  ('Design & Creative', 'design-creative', '🎨', 3),
  ('Business & Management', 'business-management', '💼', 4),
  ('Sales & Customer Service', 'sales-customer-service', '🤝', 5),
  ('Finance & Accounting', 'finance-accounting', '💰', 6),
  ('Human Resources', 'human-resources', '👥', 7),
  ('Healthcare & Medical', 'healthcare-medical', '⚕️', 8),
  ('Education & Training', 'education-training', '🎓', 9),
  ('Engineering', 'engineering', '⚙️', 10),
  ('Legal', 'legal', '⚖️', 11),
  ('Construction & Real Estate', 'construction-real-estate', '🏗️', 12),
  ('Retail & E-commerce', 'retail-ecommerce', '🛍️', 13),
  ('Hospitality & Tourism', 'hospitality-tourism', '🏨', 14),
  ('Media & Communications', 'media-communications', '📰', 15),
  ('Logistics & Transportation', 'logistics-transportation', '🚚', 16),
  ('Manufacturing', 'manufacturing', '🏭', 17),
  ('Security', 'security', '🛡️', 18),
  ('Government & Public Sector', 'government-public-sector', '🏛️', 19),
  ('NGO & Nonprofit', 'ngo-nonprofit', '🤲', 20),
  ('Agriculture & Environment', 'agriculture-environment', '🌾', 21),
  ('Remote & Freelance', 'remote-freelance', '🌐', 22),
  ('Internships & Entry Level', 'internships-entry-level', '🎯', 23),
  ('Other / General', 'other-general', '📋', 24);

-- ---------------------------------------------------------------
-- Children — one INSERT, joined to the parents above by slug.
-- ---------------------------------------------------------------
insert into public.job_categories (name, slug, parent_id, sort_order)
select v.name, v.slug, jc.id, v.sort_order
from (values
  -- Technology & IT
  ('Web Development', 'web-development', 'technology-it', 1),
  ('Software Development', 'software-development', 'technology-it', 2),
  ('Mobile App Development', 'mobile-app-development', 'technology-it', 3),
  ('Frontend Development', 'frontend-development', 'technology-it', 4),
  ('Backend Development', 'backend-development', 'technology-it', 5),
  ('Full Stack Development', 'full-stack-development', 'technology-it', 6),
  ('WordPress', 'wordpress', 'technology-it', 7),
  ('UI/UX Design', 'ui-ux-design-tech', 'technology-it', 8),
  ('DevOps', 'devops', 'technology-it', 9),
  ('Cloud Computing', 'cloud-computing', 'technology-it', 10),
  ('Cybersecurity', 'cybersecurity', 'technology-it', 11),
  ('Database Administration', 'database-administration', 'technology-it', 12),
  ('QA / Software Testing', 'qa-software-testing', 'technology-it', 13),
  ('Data Science', 'data-science', 'technology-it', 14),
  ('Artificial Intelligence', 'artificial-intelligence', 'technology-it', 15),
  ('Machine Learning', 'machine-learning', 'technology-it', 16),
  ('IT Support', 'it-support', 'technology-it', 17),
  ('Networking', 'networking', 'technology-it', 18),

  -- Digital Marketing & SEO
  ('SEO', 'seo', 'digital-marketing-seo', 1),
  ('Local SEO', 'local-seo-jobs', 'digital-marketing-seo', 2),
  ('GEO / AEO', 'geo-aeo', 'digital-marketing-seo', 3),
  ('Digital Marketing', 'digital-marketing', 'digital-marketing-seo', 4),
  ('Social Media Marketing', 'social-media-marketing', 'digital-marketing-seo', 5),
  ('Content Marketing', 'content-marketing-jobs', 'digital-marketing-seo', 6),
  ('Email Marketing', 'email-marketing', 'digital-marketing-seo', 7),
  ('PPC / Paid Advertising', 'ppc-paid-advertising', 'digital-marketing-seo', 8),
  ('Performance Marketing', 'performance-marketing', 'digital-marketing-seo', 9),
  ('Affiliate Marketing', 'affiliate-marketing', 'digital-marketing-seo', 10),
  ('Marketing Strategy', 'marketing-strategy', 'digital-marketing-seo', 11),
  ('Copywriting', 'copywriting', 'digital-marketing-seo', 12),

  -- Design & Creative
  ('Graphic Design', 'graphic-design-jobs', 'design-creative', 1),
  ('UI/UX', 'ui-ux-design-creative', 'design-creative', 2),
  ('Branding', 'branding', 'design-creative', 3),
  ('Video Editing', 'video-editing', 'design-creative', 4),
  ('Animation', 'animation', 'design-creative', 5),
  ('Motion Graphics', 'motion-graphics', 'design-creative', 6),
  ('Photography', 'photography', 'design-creative', 7),
  ('Illustration', 'illustration', 'design-creative', 8),
  ('Creative Direction', 'creative-direction', 'design-creative', 9),

  -- Business & Management
  ('Business Development', 'business-development', 'business-management', 1),
  ('Operations', 'operations', 'business-management', 2),
  ('Project Management', 'project-management', 'business-management', 3),
  ('Product Management', 'product-management', 'business-management', 4),
  ('Office Management', 'office-management', 'business-management', 5),
  ('Administration', 'administration', 'business-management', 6),
  ('Strategy', 'strategy', 'business-management', 7),
  ('Consulting', 'consulting', 'business-management', 8),

  -- Sales & Customer Service
  ('Sales', 'sales', 'sales-customer-service', 1),
  ('Business Development', 'business-development-sales', 'sales-customer-service', 2),
  ('Telemarketing', 'telemarketing', 'sales-customer-service', 3),
  ('Customer Support', 'customer-support', 'sales-customer-service', 4),
  ('Customer Success', 'customer-success', 'sales-customer-service', 5),
  ('Call Center', 'call-center', 'sales-customer-service', 6),
  ('Relationship Management', 'relationship-management', 'sales-customer-service', 7),

  -- Finance & Accounting
  ('Accounting', 'accounting-jobs', 'finance-accounting', 1),
  ('Finance', 'finance-jobs', 'finance-accounting', 2),
  ('Audit', 'audit', 'finance-accounting', 3),
  ('Taxation', 'taxation', 'finance-accounting', 4),
  ('Banking', 'banking', 'finance-accounting', 5),
  ('Investment', 'investment', 'finance-accounting', 6),
  ('Bookkeeping', 'bookkeeping', 'finance-accounting', 7),
  ('Payroll', 'payroll', 'finance-accounting', 8),

  -- Human Resources
  ('HR', 'hr', 'human-resources', 1),
  ('Recruitment', 'recruitment', 'human-resources', 2),
  ('Talent Acquisition', 'talent-acquisition', 'human-resources', 3),
  ('Training & Development', 'training-development', 'human-resources', 4),
  ('Payroll / HR Operations', 'payroll-hr-operations', 'human-resources', 5),

  -- Healthcare & Medical
  ('Doctor', 'doctor', 'healthcare-medical', 1),
  ('Dentist', 'dentist', 'healthcare-medical', 2),
  ('Nursing', 'nursing', 'healthcare-medical', 3),
  ('Pharmacy', 'pharmacy', 'healthcare-medical', 4),
  ('Medical Technician', 'medical-technician', 'healthcare-medical', 5),
  ('Physiotherapy', 'physiotherapy-jobs', 'healthcare-medical', 6),
  ('Healthcare Administration', 'healthcare-administration', 'healthcare-medical', 7),
  ('Medical Sales', 'medical-sales', 'healthcare-medical', 8),

  -- Education & Training
  ('Teaching', 'teaching', 'education-training', 1),
  ('School Administration', 'school-administration', 'education-training', 2),
  ('University / College', 'university-college', 'education-training', 3),
  ('Online Teaching', 'online-teaching', 'education-training', 4),
  ('Tutoring', 'tutoring', 'education-training', 5),
  ('Training', 'training', 'education-training', 6),
  ('Education Management', 'education-management', 'education-training', 7),

  -- Engineering
  ('Civil Engineering', 'civil-engineering', 'engineering', 1),
  ('Mechanical Engineering', 'mechanical-engineering', 'engineering', 2),
  ('Electrical Engineering', 'electrical-engineering', 'engineering', 3),
  ('Electronics Engineering', 'electronics-engineering', 'engineering', 4),
  ('Chemical Engineering', 'chemical-engineering', 'engineering', 5),
  ('Industrial Engineering', 'industrial-engineering', 'engineering', 6),
  ('Architecture', 'architecture', 'engineering', 7),
  ('Quantity Surveying', 'quantity-surveying', 'engineering', 8),

  -- Legal
  ('Lawyer', 'lawyer', 'legal', 1),
  ('Legal Advisor', 'legal-advisor', 'legal', 2),
  ('Paralegal', 'paralegal', 'legal', 3),
  ('Compliance', 'compliance', 'legal', 4),

  -- Construction & Real Estate
  ('Construction', 'construction', 'construction-real-estate', 1),
  ('Site Management', 'site-management', 'construction-real-estate', 2),
  ('Real Estate', 'real-estate-jobs', 'construction-real-estate', 3),
  ('Property Management', 'property-management', 'construction-real-estate', 4),
  ('Architecture', 'architecture-construction', 'construction-real-estate', 5),
  ('Interior Design', 'interior-design-jobs', 'construction-real-estate', 6),

  -- Retail & E-commerce
  ('Retail', 'retail', 'retail-ecommerce', 1),
  ('Store Management', 'store-management', 'retail-ecommerce', 2),
  ('E-commerce', 'ecommerce', 'retail-ecommerce', 3),
  ('Amazon', 'amazon', 'retail-ecommerce', 4),
  ('Daraz', 'daraz', 'retail-ecommerce', 5),
  ('Shopify', 'shopify', 'retail-ecommerce', 6),
  ('Merchandising', 'merchandising', 'retail-ecommerce', 7),
  ('Inventory', 'inventory', 'retail-ecommerce', 8),

  -- Hospitality & Tourism
  ('Hotel', 'hotel', 'hospitality-tourism', 1),
  ('Restaurant', 'restaurant', 'hospitality-tourism', 2),
  ('Chef', 'chef', 'hospitality-tourism', 3),
  ('Front Desk', 'front-desk', 'hospitality-tourism', 4),
  ('Housekeeping', 'housekeeping', 'hospitality-tourism', 5),
  ('Travel & Tourism', 'travel-tourism', 'hospitality-tourism', 6),
  ('Event Management', 'event-management', 'hospitality-tourism', 7),

  -- Media & Communications
  ('Journalism', 'journalism', 'media-communications', 1),
  ('Public Relations', 'public-relations', 'media-communications', 2),
  ('Media', 'media', 'media-communications', 3),
  ('Broadcasting', 'broadcasting', 'media-communications', 4),
  ('Communications', 'communications', 'media-communications', 5),
  ('Content Creation', 'content-creation', 'media-communications', 6),

  -- Logistics & Transportation
  ('Logistics', 'logistics', 'logistics-transportation', 1),
  ('Supply Chain', 'supply-chain', 'logistics-transportation', 2),
  ('Warehouse', 'warehouse', 'logistics-transportation', 3),
  ('Delivery', 'delivery', 'logistics-transportation', 4),
  ('Driving', 'driving', 'logistics-transportation', 5),
  ('Procurement', 'procurement', 'logistics-transportation', 6),

  -- Manufacturing
  ('Production', 'production', 'manufacturing', 1),
  ('Quality Control', 'quality-control', 'manufacturing', 2),
  ('Factory Operations', 'factory-operations', 'manufacturing', 3),
  ('Maintenance', 'maintenance', 'manufacturing', 4),
  ('Packaging', 'packaging', 'manufacturing', 5),

  -- Security
  ('Security Guard', 'security-guard', 'security', 1),
  ('Security Management', 'security-management', 'security', 2),
  ('Risk Management', 'risk-management', 'security', 3),

  -- Government & Public Sector
  ('Government Jobs', 'government-jobs', 'government-public-sector', 1),
  ('Public Administration', 'public-administration', 'government-public-sector', 2),
  ('Public Services', 'public-services', 'government-public-sector', 3),

  -- NGO & Nonprofit
  ('NGO', 'ngo', 'ngo-nonprofit', 1),
  ('Social Development', 'social-development', 'ngo-nonprofit', 2),
  ('Community Services', 'community-services', 'ngo-nonprofit', 3),
  ('Fundraising', 'fundraising', 'ngo-nonprofit', 4),

  -- Agriculture & Environment
  ('Agriculture', 'agriculture', 'agriculture-environment', 1),
  ('Farming', 'farming', 'agriculture-environment', 2),
  ('Veterinary', 'veterinary', 'agriculture-environment', 3),
  ('Environmental Services', 'environmental-services', 'agriculture-environment', 4),

  -- Remote & Freelance
  ('Remote Jobs', 'remote-jobs', 'remote-freelance', 1),
  ('Freelance', 'freelance', 'remote-freelance', 2),
  ('Contract', 'contract', 'remote-freelance', 3),
  ('Part-Time', 'part-time', 'remote-freelance', 4),
  ('Gig Work', 'gig-work', 'remote-freelance', 5),

  -- Internships & Entry Level
  ('Internships', 'internships', 'internships-entry-level', 1),
  ('Graduate Jobs', 'graduate-jobs', 'internships-entry-level', 2),
  ('Entry Level', 'entry-level', 'internships-entry-level', 3),
  ('Apprenticeships', 'apprenticeships', 'internships-entry-level', 4),
  ('Trainee Programs', 'trainee-programs', 'internships-entry-level', 5),

  -- Other / General
  ('General Jobs', 'general-jobs', 'other-general', 1),
  ('Other Professional Services', 'other-professional-services', 'other-general', 2)
) as v(name, slug, parent_slug, sort_order)
join public.job_categories jc on jc.slug = v.parent_slug;

-- Verify: expect 24 parents + roughly 158 children = ~182 rows total.
select
  (select count(*) from public.job_categories where parent_id is null) as parent_count,
  (select count(*) from public.job_categories where parent_id is not null) as child_count,
  (select count(*) from public.job_categories) as total_count;

commit;
