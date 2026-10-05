-- ============================================================
-- 005_dashboards_seed.sql
-- Realistic seed data for all dashboard domains.
-- Guarded by a sentinel so it only seeds once; re-running no-ops.
-- ============================================================

DO $seed$
DECLARE
  acct_ids UUID[];
  cat_exp UUID[];
  cat_inc UUID[];
  g INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM crm_lead) THEN
    RAISE NOTICE 'Dashboards seed already applied — skipping.';
    RETURN;
  END IF;

  -- ---------------- CRM ----------------
  INSERT INTO crm_lead (name, company, email, stage, value, source, owner) VALUES
    ('Olivia Bennett','Northwind Traders','olivia@northwind.com','qualified',48000,'Website','A. Rahman'),
    ('Liam Carter','Globex Corp','liam@globex.com','contacted',32000,'Referral','S. Patel'),
    ('Emma Watson','Initech','emma@initech.com','new',15000,'LinkedIn','M. Chen'),
    ('Noah Davis','Umbrella Inc','noah@umbrella.com','proposal',76000,'Event','A. Rahman'),
    ('Ava Martinez','Soylent Co','ava@soylent.com','won',54000,'Website','L. Gomez'),
    ('William Lee','Hooli','will@hooli.com','contacted',28000,'Cold call','S. Patel'),
    ('Sophia Kim','Stark Industries','sophia@stark.com','qualified',91000,'Referral','M. Chen'),
    ('James Wright','Wayne Enterprises','james@wayne.com','lost',12000,'Website','L. Gomez'),
    ('Isabella Nguyen','Acme Corp','bella@acme.com','proposal',63000,'Event','A. Rahman'),
    ('Mason Clark','Cyberdyne','mason@cyberdyne.com','new',21000,'LinkedIn','S. Patel');

  INSERT INTO crm_opportunity (name, account, stage, amount, probability, close_date, owner) VALUES
    ('Enterprise rollout','Stark Industries','negotiation',120000,70,current_date + 20,'M. Chen'),
    ('Annual renewal','Acme Corp','proposal',64000,55,current_date + 12,'A. Rahman'),
    ('Pilot expansion','Globex Corp','discovery',38000,25,current_date + 40,'S. Patel'),
    ('Platform migration','Umbrella Inc','negotiation',95000,65,current_date + 18,'A. Rahman'),
    ('New logo deal','Hooli','proposal',52000,50,current_date + 25,'M. Chen'),
    ('Upsell add-ons','Soylent Co','won',27000,100,current_date - 3,'L. Gomez'),
    ('Services engagement','Northwind Traders','discovery',44000,20,current_date + 50,'S. Patel'),
    ('Competitive replace','Cyberdyne','negotiation',88000,60,current_date + 15,'M. Chen');

  INSERT INTO crm_activity (type, subject, related_to, owner, due_date, status) VALUES
    ('call','Discovery call','Stark Industries','M. Chen', now() + interval '2 hours','open'),
    ('email','Send proposal','Acme Corp','A. Rahman', now() + interval '1 day','open'),
    ('meeting','QBR','Umbrella Inc','A. Rahman', now() + interval '3 days','open'),
    ('task','Prepare contract','Hooli','M. Chen', now() + interval '1 day','open'),
    ('call','Follow-up','Globex Corp','S. Patel', now() - interval '1 day','done'),
    ('email','Pricing options','Cyberdyne','M. Chen', now() + interval '4 hours','open'),
    ('meeting','Kickoff','Soylent Co','L. Gomez', now() + interval '5 days','open');

  -- ---------------- E-commerce ----------------
  INSERT INTO shop_product (name, sku, category, price, cost, stock, status, units_sold) VALUES
    ('Aurora Wireless Headphones','AUD-001','Audio',199.00,92.00,420,'active',1280),
    ('Nimbus Smartwatch','WER-014','Wearables',249.00,120.00,180,'active',940),
    ('Terra Running Shoes','FOO-220','Footwear',129.00,54.00,65,'active',2110),
    ('Lumen Desk Lamp','HOM-087','Home',59.00,22.00,12,'active',760),
    ('Volt Power Bank','ACC-305','Accessories',39.00,14.00,0,'active',3200),
    ('Pixel 4K Webcam','CAM-112','Cameras',89.00,41.00,230,'active',540),
    ('Drift Mechanical Keyboard','ACC-410','Accessories',149.00,70.00,95,'active',680),
    ('Breeze Air Purifier','HOM-150','Home',179.00,88.00,34,'active',290),
    ('Flux USB-C Hub','ACC-511','Accessories',49.00,18.00,7,'active',1450),
    ('Echo Bluetooth Speaker','AUD-022','Audio',99.00,44.00,160,'active',1020),
    ('Summit Backpack','BAG-018','Bags',119.00,52.00,210,'draft',0),
    ('Glide Ergonomic Mouse','ACC-530','Accessories',59.00,23.00,140,'active',870);

  INSERT INTO shop_customer (name, email) VALUES
    ('Grace Hopper','grace@example.com'),('Alan Turing','alan@example.com'),
    ('Ada Lovelace','ada@example.com'),('Katherine Johnson','kat@example.com'),
    ('Linus Pauling','linus@example.com'),('Marie Curie','marie@example.com');

  INSERT INTO shop_order (order_no, customer_name, status, total, placed_at) VALUES
    ('#10451','Grace Hopper','delivered',398.00, now() - interval '1 day'),
    ('#10452','Alan Turing','shipped',249.00, now() - interval '2 days'),
    ('#10453','Ada Lovelace','processing',188.00, now() - interval '3 hours'),
    ('#10454','Katherine Johnson','pending',129.00, now() - interval '1 hour'),
    ('#10455','Linus Pauling','delivered',287.00, now() - interval '4 days'),
    ('#10456','Marie Curie','refunded',59.00, now() - interval '5 days'),
    ('#10457','Grace Hopper','shipped',447.00, now() - interval '6 hours'),
    ('#10458','Alan Turing','delivered',99.00, now() - interval '7 days');

  INSERT INTO shop_order_item (order_id, product_name, qty, unit_price)
  SELECT o.id, 'Aurora Wireless Headphones', 1, 199.00 FROM shop_order o
  UNION ALL SELECT o.id, 'Volt Power Bank', (1 + (random()*2)::int), 39.00 FROM shop_order o;

  INSERT INTO shop_review (product_name, customer_name, rating, title, body, created_at) VALUES
    ('Aurora Wireless Headphones','Grace Hopper',5,'Incredible sound','Best headphones I have owned.', now() - interval '2 days'),
    ('Nimbus Smartwatch','Alan Turing',4,'Solid daily driver','Battery could be better but great overall.', now() - interval '3 days'),
    ('Terra Running Shoes','Ada Lovelace',5,'Super comfortable','Ran a half marathon, no blisters.', now() - interval '1 day'),
    ('Lumen Desk Lamp','Marie Curie',3,'Decent','Light is nice but base is wobbly.', now() - interval '5 days'),
    ('Volt Power Bank','Linus Pauling',5,'Charges fast','Tops up my phone twice easily.', now() - interval '6 days'),
    ('Echo Bluetooth Speaker','Katherine Johnson',4,'Great for the price','Punchy bass, loud enough.', now() - interval '4 days');

  INSERT INTO shop_traffic_day (day, source, visitors, orders, revenue)
  SELECT d::date, s.src,
         (100 + (random()*700))::int,
         (2 + (random()*35))::int,
         round((500 + random()*7500)::numeric,2)
  FROM generate_series(current_date - 29, current_date, interval '1 day') d
  CROSS JOIN (VALUES ('Organic'),('Direct'),('Social'),('Email'),('Referral')) s(src);

  -- ---------------- Personal finance ----------------
  INSERT INTO pf_account (name, type, institution, balance) VALUES
    ('Everyday Checking','checking','Chase',12840.55),
    ('High-Yield Savings','savings','Ally',48200.00),
    ('Travel Rewards Card','credit','Amex',-2310.40),
    ('Brokerage','investment','Fidelity',64150.20);
  INSERT INTO pf_wallet (name, balance, color, last4, brand) VALUES
    ('Primary Visa',4820.00,'blue','4821','Visa'),
    ('Apple Card',1290.50,'gray','9032','Mastercard'),
    ('Business Amex',8640.75,'green','1007','Amex');
  INSERT INTO pf_category (name, kind, color) VALUES
    ('Salary','income','green'),('Freelance','income','teal'),('Dividends','income','emerald'),
    ('Groceries','expense','amber'),('Dining','expense','orange'),('Transport','expense','blue'),
    ('Rent','expense','red'),('Utilities','expense','violet'),('Entertainment','expense','pink'),
    ('Shopping','expense','indigo');

  SELECT array_agg(id) INTO acct_ids FROM pf_account;
  SELECT array_agg(id) INTO cat_exp FROM pf_category WHERE kind = 'expense';
  SELECT array_agg(id) INTO cat_inc FROM pf_category WHERE kind = 'income';

  FOR g IN 0..149 LOOP
    IF g % 15 = 0 THEN
      INSERT INTO pf_transaction (account_id, category_id, description, merchant, amount, direction, status, txn_date)
      VALUES (acct_ids[1], cat_inc[1 + (g % array_length(cat_inc,1))],
              'Incoming payment', 'ACME Payroll',
              round((1500 + random()*3500)::numeric,2), 'credit', 'posted',
              current_date - (g % 90));
    ELSE
      INSERT INTO pf_transaction (account_id, category_id, description, merchant, amount, direction, status, txn_date)
      VALUES (acct_ids[1 + (g % array_length(acct_ids,1))], cat_exp[1 + (g % array_length(cat_exp,1))],
              'Purchase', (ARRAY['Whole Foods','Uber','Amazon','Netflix','Shell','Starbucks','Target','Spotify'])[1 + (g % 8)],
              round((8 + random()*240)::numeric,2), 'debit',
              (CASE WHEN g < 5 THEN 'pending' ELSE 'posted' END),
              current_date - (g % 90));
    END IF;
  END LOOP;
  -- a few scheduled/upcoming
  INSERT INTO pf_transaction (account_id, category_id, description, merchant, amount, direction, status, txn_date) VALUES
    (acct_ids[1], (SELECT id FROM pf_category WHERE name='Rent'),'Rent','Oakwood Apartments',2200.00,'debit','scheduled',current_date + 5),
    (acct_ids[1], (SELECT id FROM pf_category WHERE name='Utilities'),'Electric bill','City Power',140.00,'debit','scheduled',current_date + 8);

  -- ---------------- Logistics ----------------
  INSERT INTO log_shipment (tracking_no, customer, origin, destination, carrier, status, progress,
                            origin_lat, origin_lng, dest_lat, dest_lng, current_lat, current_lng, eta, weight_kg) VALUES
    ('TRK-88213','Northwind','Los Angeles, US','Chicago, US','FedEx','in_transit',62,34.0522,-118.2437,41.8781,-87.6298,38.5,-102.0, now()+interval '2 days',320.5),
    ('TRK-88214','Globex','Shanghai, CN','Rotterdam, NL','Maersk','in_transit',40,31.2304,121.4737,51.9244,4.4777,20.0,80.0, now()+interval '9 days',12400.0),
    ('TRK-88215','Initech','Austin, US','New York, US','UPS','out_for_delivery',92,30.2672,-97.7431,40.7128,-74.0060,40.4,-74.5, now()+interval '6 hours',55.2),
    ('TRK-88216','Umbrella','Berlin, DE','Madrid, ES','DHL','delayed',48,52.52,13.405,40.4168,-3.7038,46.0,5.0, now()+interval '3 days',210.0),
    ('TRK-88217','Soylent','Tokyo, JP','Sydney, AU','Yamato','in_transit',55,35.6762,139.6503,-33.8688,151.2093,0.0,145.0, now()+interval '4 days',840.0),
    ('TRK-88218','Hooli','San Francisco, US','Seattle, US','FedEx','delivered',100,37.7749,-122.4194,47.6062,-122.3321,47.6062,-122.3321, now()-interval '1 day',18.0),
    ('TRK-88219','Stark','London, GB','Dubai, AE','Emirates','pending',5,51.5074,-0.1278,25.2048,55.2708,51.5074,-0.1278, now()+interval '6 days',430.0),
    ('TRK-88220','Wayne','Toronto, CA','Mexico City, MX','UPS','in_transit',73,43.6532,-79.3832,19.4326,-99.1332,30.0,-95.0, now()+interval '2 days',96.4);

  -- ---------------- Infrastructure ----------------
  INSERT INTO infra_project (name, framework, repo) VALUES
    ('marketing-site','Next.js','acme/marketing-site'),
    ('api-gateway','Node.js','acme/api-gateway'),
    ('admin-dashboard','Next.js','acme/admin-dashboard');

  INSERT INTO infra_environment (project_id, name, status, url, region, commit_sha, commit_message, branch, deployed_by, last_deploy_at, uptime_pct)
  SELECT p.id, e.name, e.status, e.url, e.region, e.sha, e.msg, e.branch, e.who, now() - e.ago, e.uptime
  FROM infra_project p
  JOIN (VALUES
    ('marketing-site','production','ready','https://acme.com','iad1','a1b2c3d','Fix hero layout','main','A. Rahman', interval '4 hours', 99.98),
    ('marketing-site','preview','building','https://preview.acme.com','iad1','e4f5g6h','Add pricing page','feat/pricing','S. Patel', interval '10 minutes', 99.90),
    ('api-gateway','production','ready','https://api.acme.com','sfo1','11a22b3','Bump rate limits','main','M. Chen', interval '1 day', 99.95),
    ('api-gateway','preview','error','https://api-preview.acme.com','sfo1','44c55d6','WIP auth refactor','feat/auth','M. Chen', interval '30 minutes', 98.20),
    ('admin-dashboard','production','ready','https://admin.acme.com','fra1','77e88f9','Release 2.2.0','main','L. Gomez', interval '6 hours', 99.99),
    ('admin-dashboard','preview','queued','https://admin-preview.acme.com','fra1','aa11bb2','Finance analyst module','feat/finance','A. Rahman', interval '2 minutes', 99.90)
  ) AS e(proj, name, status, url, region, sha, msg, branch, who, ago, uptime) ON e.proj = p.name;

  -- ---------------- Patient monitoring ----------------
  INSERT INTO pm_patient (name, age, gender, room, condition, status, admitted_at) VALUES
    ('John Carter',64,'M','ICU-1','Post-op cardiac','critical', now()-interval '2 days'),
    ('Maria Lopez',48,'F','ICU-2','Respiratory distress','monitor', now()-interval '1 day'),
    ('David Kim',55,'M','ICU-3','Sepsis','critical', now()-interval '3 days'),
    ('Sarah Ahmed',33,'F','W-204','Post-op recovery','stable', now()-interval '12 hours'),
    ('Robert Fox',71,'M','W-210','Pneumonia','monitor', now()-interval '4 days'),
    ('Emily Stone',29,'F','W-215','Observation','stable', now()-interval '6 hours');

  INSERT INTO pm_vital (patient_id, measured_at, heart_rate, spo2, resp_rate, temperature, systolic, diastolic)
  SELECT p.id,
         now() - (s.n || ' minutes')::interval,
         (72 + (random()*30)::int - 10),
         (94 + (random()*6)::int),
         (14 + (random()*8)::int),
         round((36.5 + random()*1.5)::numeric,1),
         (110 + (random()*30)::int),
         (70 + (random()*20)::int)
  FROM pm_patient p CROSS JOIN generate_series(0,29) AS s(n);

  -- ---------------- Academy ----------------
  INSERT INTO edu_course (title, instructor, category, lessons, students, rating, status) VALUES
    ('Intro to Data Science','Dr. Patel','Data',42,1280,4.8,'published'),
    ('Modern React','J. Rivera','Web',36,2140,4.7,'published'),
    ('Financial Accounting','M. Chen','Finance',28,860,4.6,'published'),
    ('UX Design Foundations','A. Rahman','Design',31,1540,4.9,'published'),
    ('Cloud Architecture','L. Gomez','Cloud',40,720,4.5,'published'),
    ('Machine Learning 101','Dr. Patel','Data',48,1960,4.8,'published'),
    ('Digital Marketing','S. Lee','Marketing',24,1120,4.4,'draft'),
    ('Cybersecurity Basics','K. Novak','Security',33,640,4.6,'published');

  INSERT INTO edu_assignment (course_title, title, due_date, submitted, total, status) VALUES
    ('Modern React','Build a todo app', current_date + 3, 142, 210, 'open'),
    ('Intro to Data Science','Pandas exercise', current_date + 1, 98, 128, 'open'),
    ('Financial Accounting','Trial balance set', current_date - 1, 80, 86, 'grading'),
    ('UX Design Foundations','Wireframe critique', current_date + 5, 40, 154, 'open'),
    ('Machine Learning 101','Linear regression lab', current_date + 2, 120, 196, 'open'),
    ('Cloud Architecture','Design a VPC', current_date - 3, 70, 72, 'closed');

  INSERT INTO edu_event (title, kind, location, start_at, end_at) VALUES
    ('React live session','class','Room A', now()+interval '1 day', now()+interval '1 day 2 hours'),
    ('Midterm exam','exam','Hall 2', now()+interval '3 days', now()+interval '3 days 3 hours'),
    ('Design workshop','workshop','Lab 1', now()+interval '2 days', now()+interval '2 days 4 hours'),
    ('Assignment deadline','deadline','Online', now()+interval '4 days', now()+interval '4 days'),
    ('Guest lecture: ML in prod','class','Auditorium', now()+interval '5 days', now()+interval '5 days 1 hour');

  -- ---------------- File manager ----------------
  INSERT INTO fm_folder (name, owner) VALUES
    ('Documents','me'),('Images','me'),('Projects','me'),('Invoices','me'),('Archive','me');

  INSERT INTO fm_file (folder_id, name, kind, size_bytes, owner, starred, updated_at)
  SELECT f.id, x.name, x.kind, x.size, 'me', x.starred, now() - x.ago
  FROM fm_folder f
  JOIN (VALUES
    ('Documents','Q3 report.docx','document',248000, false, interval '2 days'),
    ('Documents','Roadmap.pdf','pdf',1340000, true, interval '1 day'),
    ('Documents','Notes.txt','document',4200, false, interval '5 hours'),
    ('Images','hero-banner.png','image',820000, true, interval '3 days'),
    ('Images','team-photo.jpg','image',2400000, false, interval '6 days'),
    ('Projects','design-system.fig','file',5600000, true, interval '1 day'),
    ('Projects','budget.xlsx','spreadsheet',96000, false, interval '2 days'),
    ('Invoices','invoice-1001.pdf','pdf',120000, false, interval '4 days'),
    ('Archive','backup-2025.zip','archive',58000000, false, interval '30 days'),
    ('Archive','demo.mp4','video',124000000, false, interval '10 days')
  ) AS x(folder, name, kind, size, starred, ago) ON x.folder = f.name;

  -- ---------------- Invoices ----------------
  INSERT INTO inv_client (name, email, company, address) VALUES
    ('Aurora Retail Group','ap@aurora.com','Aurora Retail','120 Market St, San Francisco, CA'),
    ('Brightline Media','billing@brightline.com','Brightline','88 Broadway, New York, NY'),
    ('Cobalt Systems','finance@cobalt.io','Cobalt','9 King St, Austin, TX'),
    ('Delta Logistics','pay@deltalog.com','Delta','400 Dock Rd, Seattle, WA');

  INSERT INTO inv_invoice (invoice_no, client_id, issue_date, due_date, status, tax_rate, discount, notes)
  SELECT v.no, c.id, v.issue, v.due, v.status, v.tax, v.disc, v.notes
  FROM (VALUES
    ('INV-2001','Aurora Retail Group', current_date - 20, current_date + 10, 'sent', 8.5, 0, 'Thanks for your business.'),
    ('INV-2002','Brightline Media', current_date - 45, current_date - 15, 'overdue', 8.5, 100, 'Net 30.'),
    ('INV-2003','Cobalt Systems', current_date - 5, current_date + 25, 'draft', 0, 0, NULL),
    ('INV-2004','Delta Logistics', current_date - 60, current_date - 30, 'paid', 8.5, 0, 'Paid in full.')
  ) AS v(no, client_name, issue, due, status, tax, disc, notes)
  JOIN inv_client c ON c.name = v.client_name;

  INSERT INTO inv_item (invoice_id, description, qty, unit_price, line_no)
  SELECT i.id, x.descr, x.qty, x.price, x.ln
  FROM inv_invoice i
  JOIN (VALUES
    ('INV-2001','Platform subscription (annual)',1,12000,1),
    ('INV-2001','Onboarding & setup',1,2500,2),
    ('INV-2002','Design retainer',20,150,1),
    ('INV-2002','Ad creative pack',5,400,2),
    ('INV-2003','Consulting hours',40,175,1),
    ('INV-2004','Freight services',12,850,1)
  ) AS x(no, descr, qty, price, ln) ON x.no = i.invoice_no;

  -- ---------------- Productivity ----------------
  INSERT INTO prod_project (name, color, progress, status, due_date) VALUES
    ('Website redesign','blue',72,'active',current_date + 14),
    ('Mobile app v2','violet',45,'active',current_date + 30),
    ('Q4 marketing','amber',20,'active',current_date + 45),
    ('Data migration','green',90,'active',current_date + 5),
    ('Brand refresh','pink',100,'done',current_date - 10);
  INSERT INTO prod_note (title, body, pinned) VALUES
    ('Standup notes','Discussed sprint goals and blockers for the week.', true),
    ('Ideas','Explore a command palette and keyboard shortcuts.', false),
    ('Retro','What went well: shipping cadence. Improve: QA coverage.', false),
    ('1:1 agenda','Career growth, upcoming projects, feedback.', false);

  -- ---------------- Analytics ----------------
  INSERT INTO an_traffic_day (day, visitors, pageviews, sessions, bounce_rate, avg_duration_sec)
  SELECT d::date,
         (3000 + (random()*1800))::int,
         (8000 + (random()*5000))::int,
         (3500 + (random()*1600))::int,
         round((38 + random()*22)::numeric,2),
         (110 + (random()*150))::int
  FROM generate_series(current_date - 29, current_date, interval '1 day') d;

  INSERT INTO an_page (path, views, unique_views, avg_time_sec, bounce_rate) VALUES
    ('/',48200,31200,74,42.1),
    ('/pricing',21400,17800,96,35.4),
    ('/blog/launch',18900,15600,152,28.9),
    ('/docs',16700,9800,210,22.3),
    ('/features',14200,11100,88,39.7),
    ('/contact',9800,8700,64,51.2),
    ('/about',7600,6500,70,46.8);

  INSERT INTO an_source (source, kind, sessions, share) VALUES
    ('Google','organic',42100,38.5),
    ('Direct','direct',29800,27.2),
    ('Twitter / X','social',12400,11.3),
    ('Newsletter','email',9600,8.8),
    ('Product Hunt','referral',7300,6.7),
    ('Google Ads','paid',8200,7.5);

  RAISE NOTICE 'Dashboards seed applied successfully.';
END
$seed$;
