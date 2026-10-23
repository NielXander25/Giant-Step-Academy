# Giant Step Academy — launch checklist

Work through this top to bottom. Tick each box before going live. Nothing here needs a terminal.

## 1. Accounts and plans
- [ ] **Vercel**: move from the free Hobby plan to a paid plan (Hobby is for personal, non-commercial use).
- [ ] **Neon**: check the plan's database sleep and backup (restore) window. Consider a paid plan before result day so the database never pauses.
- [ ] **Cloudinary** (free is fine) for website pictures.
- [ ] **Resend** (optional) so approval emails and website enquiries are emailed.
- [ ] **Cloudflare Turnstile** (optional, free) for the "I am not a robot" check on the result page.
- [ ] A **domain name** pointed at Vercel (Vercel > Settings > Domains).

## 2. Vercel settings (Settings > Environment Variables, Production)
| Name | Needed | What it is |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | yes | Neon connection strings |
| `AUTH_SECRET` | yes | 40+ random characters. Signs staff logins |
| `PIN_PEPPER` | yes | 40+ random characters. **Never change it** or every PIN stops working. Keep a safe copy |
| `CRON_SECRET` | yes | 24+ random characters. Lets the nightly cleanup run (Vercel sends it automatically) |
| `NEXT_PUBLIC_SITE_URL` | yes | The final website address, e.g. `https://www.giantstepacademy.ng` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for uploads | From Cloudinary |
| `RESEND_API_KEY`, `EMAIL_FROM` | optional | Emails |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | optional | Bot check |

- [ ] **Remove** `SETUP_TOKEN` and `SUPER_ADMIN_PASSWORD` once the Super Admin exists.
- [ ] Redeploy after changing any variable.

## 3. Real school information (Admin screens)
- [ ] **School & report card**: real name, motto, address, phone, email, principal's name. Upload the **official logo** under Website content > Pictures.
- [ ] **Sessions & terms**: create the real session; make the right session and term current.
- [ ] **Classes**: replace the sample classes with the school's real structure (Nursery, Primary, Secondary, arms). Check each level's "promotes to" and the final level.
- [ ] **Subjects**, then **Assignments** (Form Teachers and subject teachers).
- [ ] **Grading** and **Assessment & rules**: the school's real marking scheme, grades, tie rule and missing-subject rule.
- [ ] Teachers register and are approved; Admins created; **everyone changes their temporary password**.
- [ ] Students imported (spreadsheet) for every class. Mark repeaters.

## 4. Website
- [ ] Replace sample text and pictures (Website content > Pictures and Page text). Remove sample content when real content is in.
- [ ] Fill in or hide: principal's message, fees, office hours, FAQ, facilities.
- [ ] Review the **Privacy notice** with someone qualified (it is a draft). Get consent before publishing photos of children.
- [ ] Test the contact form on a phone and confirm the message appears under Enquiries.

## 5. Dry run (do this a week before real results)
Use a test class. Walk one result all the way through:
- [ ] Subject teacher enters and submits scores.
- [ ] Form Teacher reviews and sends the class to the Admin. Add remarks.
- [ ] A **different** Admin approves and publishes.
- [ ] Create PINs. Open the result on a phone with the name, admission number and PIN. Print and download the PDF.
- [ ] Try a wrong name, a wrong PIN, and a third use of the same PIN. Check the Access logs show each one.
- [ ] Unpublish, then republish.

## 6. Security
- [ ] Only the people who need it have Admin accounts. Deactivate leavers straight away.
- [ ] PINs are given out only through the school office; the list you downloaded is kept private or deleted.
- [ ] Nobody shares a login.
- [ ] You have a safe copy of `PIN_PEPPER`, `AUTH_SECRET`, the Neon login and the Super Admin password.

## 7. Backups and recovery
- [ ] Know how to restore the database in Neon (project > Restore) and how far back it can go on your plan.
- [ ] Keep a copy of the GitHub repository (it is the source of the website).
- [ ] If an upload breaks the site, open Vercel > Deployments and **Promote** the last good deployment to restore the previous version at once.

## 8. Result day
- [ ] Publish classes early in the day; create PINs the day before.
- [ ] Keep the Access logs page open: lots of "details did not match" usually means parents are mistyping names (names must match the school's records exactly).
- [ ] Have the school office ready to issue replacement PINs (a PIN opens a result twice).

## 9. Things the system does not do (yet)
- Elective subjects: a subject marked non-compulsory only counts for students recorded as taking it, but there is no screen to record those choices.
- Pupil photographs and attendance on the report card.
- Online application forms and fee payment.
- Undoing a yearly promotion with one click (check the preview carefully before promoting).
