const SvgMail = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    height="100%"
    aria-hidden="true"
    {...props}
  >
    <rect width={18} height={14} x={3} y={5} rx={2} />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export default SvgMail;
