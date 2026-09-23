-- Adds DELETE RLS policies for the two entities the app now has a delete
-- UI for (medications, care tasks) -- see deleteMedication/deleteCareTask
-- in src/context/PawsoContext.tsx.
--
-- Scoped deliberately to just these two tables: the audit flagged that NO
-- entity could be deleted anywhere in the app (UI or database), but adding
-- delete policies for every table without a corresponding UI affordance
-- would just be unreachable/untested surface area. Add further delete
-- policies (pets, documents, medical_events, ...) together with their UI
-- when that work is scheduled -- see docs/PAWSO_AUDIT_AND_ROADMAP.md.
--
-- Permission tier matches each table's existing insert/update tier:
--   - medications:  can_manage_household_medical (owner only)
--   - care_tasks:   can_manage_household_care (owner or caregiver, not sitter)

drop policy if exists "household owners can delete medications" on public.medications;
create policy "household owners can delete medications"
on public.medications for delete to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)));

drop policy if exists "household care managers can delete care tasks" on public.care_tasks;
create policy "household care managers can delete care tasks"
on public.care_tasks for delete to authenticated
using (public.can_manage_household_care(public.pet_household(pet_id)));
