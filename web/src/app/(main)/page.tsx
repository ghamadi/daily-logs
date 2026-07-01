import { redirect } from 'next/navigation';

export default function HomePage() {
  // Single jumping-off point for the protected app — workspaces are the
  // top-level container for everything else (chats, events, etc.).
  redirect('/workspaces');
}
