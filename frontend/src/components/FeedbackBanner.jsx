function FeedbackBanner({ type = "info", message }) {
  if (!message) {
    return null;
  }

  const stylesByType = {
    info: "bg-rose-50 text-rose-700 border-rose-200",
    success: "bg-red-50 text-red-700 border-red-200",
    error: "bg-red-100 text-red-800 border-red-300",
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
