import { Link } from 'react-router-dom';

interface IPlayerBackLinkProps {
  to: string;
  label: string;
}

export const PlayerBackLink = ({
  to,
  label,
}: IPlayerBackLinkProps) => (
  <Link to={to} className="pixel-backLink">
    <span aria-hidden="true">←</span>
    <span>{label}</span>
  </Link>
);
