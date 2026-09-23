const STATUS_LABELS = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_CLASSES = {
  applied: "application-status-neutral",
  under_review: "application-status-neutral",
  shortlisted: "application-status-positive",
  interview: "application-status-positive",
  selected: "application-status-positive",
  rejected: "application-status-negative",
  withdrawn: "application-status-negative",
};

export default function ApplicationStatusBadge({ status }) {
  return (
    <span className={`application-status-badge ${STATUS_CLASSES[status] ?? "application-status-neutral"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
