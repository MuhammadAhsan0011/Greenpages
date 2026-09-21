import { PK_CITIES } from "../data/directoryCities";

// Optional — an article doesn't have to be about any one city. Reuses the
// same PK_CITIES list the business directory's city pages are built from,
// so this never drifts out of sync with what cities the site actually has.
export default function ArticleTargetCityField({ defaultValue = "" }) {
  return (
    <div className="form-field">
      <label htmlFor="targetCity">Target City</label>
      <select id="targetCity" name="targetCity" defaultValue={defaultValue}>
        <option value="">Not city-specific</option>
        {PK_CITIES.map((city) => (
          <option key={city.slug} value={city.name}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
