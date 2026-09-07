export default function PageLoader() {
  return (
    <div
      className="page-loader"
      role="status"
      aria-label="Loading"
    >
      <div className="page-loader-spinner" />
    </div>
  );
}