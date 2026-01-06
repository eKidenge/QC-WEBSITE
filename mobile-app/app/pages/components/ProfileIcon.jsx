const ProfileIcon = ({ width = 25, height = 25, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="currentColor"
    role="img"
    aria-label="Profile icon"
    {...props}
  >
    <g fillRule="evenodd" clipRule="evenodd">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
      <path d="M12 14c-4.418 0-8 3.582-8 8h16c0-4.418-3.582-8-8-8z" />
    </g>
  </svg>
);

export default ProfileIcon;
