// Adsterra "Native Banner" unit — unlike AdsterraBanner.js, this one finds
// its own container by id at load time, so it's self-contained and (per
// Adsterra's own snippet) safe to load async.
const CONTAINER_ID = "container-269c0cc708dbe1c9978fc345608f0a72";

export default function AdsterraNativeBanner({ className }) {
  return (
    <div className={className}>
      <div id={CONTAINER_ID} />
      <script
        async
        data-cfasync="false"
        src="https://bicea.org/21/269c0cc708dbe1c9978fc345608f0a72"
      />
    </div>
  );
}
