import { redirect } from 'next/navigation'

/** The home page is the list of saved rooms; new rooms are created at /rooms/new. */
export default function HomePage() {
  redirect('/rooms')
}
