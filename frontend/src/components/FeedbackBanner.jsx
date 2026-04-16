function FeedbackBanner({ type = "info", message }) {
  if (!message) {
    return null;
  }

  const stylesByType = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm ${
        stylesByType[type] || stylesByType.info
      }`}
    >
      {message}
    </p>
  );
}

export default FeedbackBanner;
