import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { fetchAllJobCategoriesAdmin, buildJobCategoryTree } from "@/lib/jobCategories";
import SubmitButton from "../../components/SubmitButton";
import {
  createJobCategory,
  updateJobCategory,
  toggleJobCategoryActive,
  deleteJobCategory,
} from "../jobCategoryActions";

export const metadata = {
  title: "Admin — Job Categories",
  robots: { index: false, follow: false },
};

function CategoryEditForm({ category }) {
  return (
    <form action={updateJobCategory} className="admin-inline-form">
      <input type="hidden" name="categoryId" value={category.id} />
      {/* Round-trips unchanged — this compact row has no visible
          description field, so the value must still be resubmitted or
          updateJobCategory would null it out on every save. */}
      <input type="hidden" name="description" defaultValue={category.description ?? ""} />
      <input type="text" name="name" defaultValue={category.name} required />
      <input type="text" name="icon" defaultValue={category.icon ?? ""} maxLength={4} className="admin-icon-input" />
      <input type="number" name="sortOrder" defaultValue={category.sort_order} className="admin-sort-input" />
      <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
        Save
      </SubmitButton>
    </form>
  );
}

export default async function AdminJobCategoriesPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const flat = await fetchAllJobCategoriesAdmin(supabase);
  const tree = buildJobCategoryTree(flat);
  const parentsOnly = flat.filter((c) => !c.parent_id);

  return (
    <section aria-labelledby="admin-job-categories-heading">
      <div className="container">
        <h1 id="admin-job-categories-heading">Job Categories</h1>
        <p className="hero-description">{flat.length} categories total.</p>

        {params?.error && <p className="form-error">{params.error}</p>}

        <div className="account-card">
          <h2>Add a Category</h2>
          <form action={createJobCategory} className="form-row">
            <div className="form-field">
              <label htmlFor="name">Name *</label>
              <input id="name" name="name" type="text" required />
            </div>
            <div className="form-field">
              <label htmlFor="parentId">Parent (leave blank for a top-level category)</label>
              <select id="parentId" name="parentId" defaultValue="">
                <option value="">— Top-level category —</option>
                {parentsOnly.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="icon">Icon (emoji)</label>
              <input id="icon" name="icon" type="text" maxLength={4} placeholder="💼" />
            </div>
            <div className="form-field">
              <label htmlFor="sortOrder">Sort Order</label>
              <input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
            </div>
            <div className="form-field">
              <label htmlFor="description">Description</label>
              <input id="description" name="description" type="text" />
            </div>
            <SubmitButton className="btn btn-primary" pendingLabel="Adding…">
              Add Category
            </SubmitButton>
          </form>
        </div>

        {tree.map((parent) => (
          <div className="account-card" key={parent.id}>
            <h2>
              {parent.icon} {parent.name} {!parent.is_active && "(Inactive)"}
            </h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Name / Icon / Sort</th>
                    <th scope="col">Slug</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <CategoryEditForm category={parent} />
                    </td>
                    <td>{parent.slug}</td>
                    <td>{parent.is_active ? "Active" : "Inactive"}</td>
                    <td className="admin-table-actions">
                      {parent.is_active ? (
                        <form action={toggleJobCategoryActive.bind(null, parent.id, false)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
                            Deactivate
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={toggleJobCategoryActive.bind(null, parent.id, true)}>
                          <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Saving…">
                            Activate
                          </SubmitButton>
                        </form>
                      )}
                      <form action={deleteJobCategory.bind(null, parent.id)}>
                        <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Deleting…">
                          Delete
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                  {parent.children.map((child) => (
                    <tr key={child.id}>
                      <td>
                        — <CategoryEditForm category={child} />
                      </td>
                      <td>{child.slug}</td>
                      <td>{child.is_active ? "Active" : "Inactive"}</td>
                      <td className="admin-table-actions">
                        {child.is_active ? (
                          <form action={toggleJobCategoryActive.bind(null, child.id, false)}>
                            <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
                              Deactivate
                            </SubmitButton>
                          </form>
                        ) : (
                          <form action={toggleJobCategoryActive.bind(null, child.id, true)}>
                            <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Saving…">
                              Activate
                            </SubmitButton>
                          </form>
                        )}
                        <form action={deleteJobCategory.bind(null, child.id)}>
                          <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Deleting…">
                            Delete
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
