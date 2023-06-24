import { MailIcon } from "@/components/template/SocialIcons"

export default function Newsletter() {
  return (
    <form
      action="/api/subscription"
      method="POST"
      className="rounded-2xl border border-base-200 p-6"
    >
      <h2 className="flex text-sm font-semibold">
        <MailIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Stay up to date</span>
      </h2>
      <p className="mt-2 text-sm text-base-content">
        Get notified when I publish something new, and unsubscribe at any time.
      </p>
      <div className="mt-6 flex gap-4">
        <label htmlFor="email" className="sr-only">
          Email address field
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="Email address"
          aria-label="Email address"
          autoComplete="on"
          required
          className="input-bordered input input-sm w-full"
        />
        <button type="submit" className="btn-primary btn-sm btn">
          Join
        </button>
      </div>
    </form>
  )
}
