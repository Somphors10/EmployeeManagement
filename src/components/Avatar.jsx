import { initials, toneFromName } from '../utils/format';

export default function Avatar({ firstName = '', lastName = '', size = 'md' }) {
  const tone = toneFromName(`${firstName} ${lastName}`);
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: tone.bg, color: tone.fg }}
    >
      {initials(firstName, lastName)}
    </span>
  );
}
