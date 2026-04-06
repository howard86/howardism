import { MailIcon } from "../(common)/icons";

export default function Newsletter() {
  return (
    <form
      action="/api/subscription"
      className="rounded-2xl border border-base-200 p-6"
      method="POST"
    >
      <h2 className="flex font-semibold text-sm">
        <MailIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Stay up to date</span>
      </h2>
      <p className="mt-2 text-base-content text-sm">
        Get notified when I publish something new, and unsubscribe at any time.
      </p>
      <div className="mt-6 flex gap-4">
        <label className="sr-only" htmlFor="email">
          Email address field
        </label>
        <input
          aria-label="Email address"
          autoComplete="on"
          className="input input-bordered input-sm w-full"
          id="email"
          name="email"
          placeholder="Email address"
          required
          type="email"
        />
        <button className="btn btn-primary btn-sm" type="submit">
          Join
        </button>
      </div>
    </form>
  );
}
