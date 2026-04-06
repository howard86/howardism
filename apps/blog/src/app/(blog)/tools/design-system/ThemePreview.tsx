import { CloseIcon } from "@/app/(common)/icons";

const LINK_TEXT = "I'm a simple link";

export default function ThemePreview() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="px-2 pb-4 font-bold text-xl">Custom</h2>

        <div className="not-prose grid gap-3 rounded-box border border-base-content/5 bg-base-100 p-6 text-base-content">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <button className="btn-brand btn" type="button">
              Default
            </button>
            <button
              aria-label="Close"
              className="btn-brand btn btn-circle"
              type="button"
            >
              <CloseIcon className="w-8" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="px-2 pb-4 font-bold text-xl">Preview</h2>
        <div className="bg-transparent">
          <div className="not-prose grid gap-3 rounded-box border border-base-content/5 bg-base-100 p-6 text-base-content">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <button className="btn" type="button">
                Default
              </button>
              <button className="btn btn-primary" type="button">
                Primary
              </button>
              <button className="btn btn-secondary" type="button">
                Secondary
              </button>
              <button className="btn btn-accent" type="button">
                Accent
              </button>
              <button className="btn btn-info" type="button">
                Info
              </button>
              <button className="btn btn-success" type="button">
                Success
              </button>
              <button className="btn btn-warning" type="button">
                Warning
              </button>
              <button className="btn btn-error" type="button">
                Error
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <button className="btn btn-outline" type="button">
                Default
              </button>
              <button className="btn btn-primary btn-outline" type="button">
                Primary
              </button>
              <button className="btn btn-secondary btn-outline" type="button">
                Secondary
              </button>
              <button className="btn btn-accent btn-outline" type="button">
                Accent
              </button>
              <button className="btn btn-info btn-outline" type="button">
                Info
              </button>
              <button className="btn btn-success btn-outline" type="button">
                Success
              </button>
              <button className="btn btn-warning btn-outline" type="button">
                Warning
              </button>
              <button className="btn btn-error btn-outline" type="button">
                Error
              </button>
            </div>

            {/* <!-- badge --> */}
            <div className="grid grid-cols-2 place-items-center gap-2 md:grid-cols-4">
              <span className="badge">Default</span>
              <span className="badge badge-primary">Primary</span>
              <span className="badge badge-secondary">Secondary</span>
              <span className="badge badge-accent">Accent</span>
              <span className="badge badge-info">Info</span>
              <span className="badge badge-success">Success</span>
              <span className="badge badge-warning">Warning</span>
              <span className="badge badge-error">Error</span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="md:w-1/2">
                  {/* <!-- tabs --> */}
                  <div className="tabs">
                    <button className="tab tab-lifted" type="button">
                      Tab
                    </button>
                    <button className="tab tab-active tab-lifted" type="button">
                      Tab
                    </button>
                    <button className="tab tab-lifted" type="button">
                      Tab
                    </button>
                  </div>
                  {/* <!-- link --> */}
                  <div className="flex flex-col font-bold">
                    <span className="link">{LINK_TEXT}</span>
                    <span className="link-primary link">{LINK_TEXT}</span>
                    <span className="link-secondary link">{LINK_TEXT}</span>
                    <span className="link-accent link">{LINK_TEXT}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 md:w-1/2">
                  <progress className="progress" max="100" value="20">
                    Default
                  </progress>
                  <progress
                    className="progress progress-primary"
                    max="100"
                    value="25"
                  >
                    Primary
                  </progress>
                  <progress
                    className="progress progress-secondary"
                    max="100"
                    value="30"
                  >
                    Secondary
                  </progress>
                  <progress
                    className="progress progress-accent"
                    max="100"
                    value="40"
                  >
                    Accent
                  </progress>
                  <progress
                    className="progress progress-info"
                    max="100"
                    value="45"
                  >
                    Info
                  </progress>
                  <progress
                    className="progress progress-success"
                    max="100"
                    value="55"
                  >
                    Success
                  </progress>
                  <progress
                    className="progress progress-warning"
                    max="100"
                    value="70"
                  >
                    Warning
                  </progress>
                  <progress
                    className="progress progress-error"
                    max="100"
                    value="90"
                  >
                    Error
                  </progress>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                {/* <!-- stat --> */}
                <div className="stats border border-base-300 bg-base-300 md:w-1/2">
                  <div className="stat">
                    <div className="stat-title">Total Page Views</div>
                    <div className="stat-value">89,400</div>
                    <div className="stat-desc">21% more than last month</div>
                  </div>
                </div>

                {/* <!-- radial progress --> */}
                <div className="flex flex-wrap items-center justify-center gap-3 md:w-1/2">
                  <div
                    className="radial-progress"
                    style={{
                      "--value": 60,
                      "--size": "3.5rem",
                    }}
                  >
                    60%
                  </div>
                  <div
                    className="radial-progress"
                    style={{
                      "--value": 75,
                      "--size": "3.5rem",
                    }}
                  >
                    75%
                  </div>
                  <div
                    className="radial-progress"
                    style={{
                      "--value": 90,
                      "--size": "3.5rem",
                    }}
                  >
                    90%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="md:w-1/2">
                  {/* <!-- toggle --> */}
                  <div>
                    <input checked className="toggle" type="checkbox" />
                    <input
                      checked
                      className="toggle toggle-primary"
                      type="checkbox"
                    />
                    <input
                      checked
                      className="toggle toggle-secondary"
                      type="checkbox"
                    />
                    <input
                      checked
                      className="toggle toggle-accent"
                      type="checkbox"
                    />
                  </div>
                  {/* <!-- checkbox --> */}
                  <div>
                    <input checked className="checkbox" type="checkbox" />
                    <input
                      checked
                      className="checkbox-primary checkbox"
                      type="checkbox"
                    />
                    <input
                      checked
                      className="checkbox-secondary checkbox"
                      type="checkbox"
                    />
                    <input
                      checked
                      className="checkbox-accent checkbox"
                      type="checkbox"
                    />
                  </div>
                  {/* <!-- radio --> */}
                  <div>
                    <input
                      checked
                      className="radio"
                      name="radio-1"
                      type="radio"
                    />
                    <input
                      className="radio-primary radio"
                      name="radio-1"
                      type="radio"
                    />
                    <input
                      className="radio-secondary radio"
                      name="radio-1"
                      type="radio"
                    />
                    <input
                      className="radio-accent radio"
                      name="radio-1"
                      type="radio"
                    />
                  </div>
                </div>
                {/* <!-- range --> */}
                <div className="md:w-1/2">
                  <input
                    className="range range-xs"
                    max="100"
                    min="0"
                    type="range"
                    value="90"
                  />
                  <input
                    className="range range-primary range-xs"
                    max="100"
                    min="0"
                    type="range"
                    value="70"
                  />
                  <input
                    className="range range-secondary range-xs"
                    max="100"
                    min="0"
                    type="range"
                    value="50"
                  />
                  <input
                    className="range range-accent range-xs"
                    max="100"
                    min="0"
                    type="range"
                    value="40"
                  />
                </div>
              </div>
              {/* <!-- input --> */}
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex flex-col gap-3 md:w-1/2">
                  <input
                    className="input input-bordered w-full"
                    placeholder="Default"
                    type="text"
                  />
                  <input
                    className="input input-bordered input-primary w-full"
                    placeholder="Primary"
                    type="text"
                  />
                  <input
                    className="input input-bordered input-secondary w-full"
                    placeholder="Secondary"
                    type="text"
                  />
                  <input
                    className="input input-bordered input-accent w-full"
                    placeholder="Accent"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-3 md:w-1/2">
                  <input
                    className="input input-bordered input-info w-full"
                    placeholder="Info"
                    type="text"
                  />
                  <input
                    className="input input-bordered input-success w-full"
                    placeholder="Success"
                    type="text"
                  />
                  <input
                    className="input input-bordered input-warning w-full"
                    placeholder="Warning"
                    type="text"
                  />
                  <input
                    className="input input-bordered input-error w-full"
                    placeholder="Error"
                    type="text"
                  />
                </div>
              </div>
              {/* <!-- navbar --> */}
              <div className="navbar rounded-box bg-neutral text-neutral-content">
                <div className="flex-none">
                  <button
                    aria-label="Navbar toggle"
                    className="btn btn-square btn-ghost"
                    type="button"
                  >
                    <svg
                      className="inline-block h-5 w-5 stroke-current"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 6h16M4 12h16M4 18h16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <button
                    className="btn btn-ghost text-xl normal-case"
                    type="button"
                  >
                    daisyUI
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                {/* <!-- headings --> */}
                <div className="flex flex-grow flex-col gap-3">
                  <div className="font-bold text-9xl">Text 9XL</div>
                  <div className="font-bold text-8xl">Text 8XL</div>
                  <div className="font-bold text-7xl">Text 7XL</div>
                  <div className="font-bold text-6xl">Text 6XL</div>
                  <div className="font-bold text-5xl">Text 5XL</div>
                  <div className="font-bold text-4xl">Text 4XL</div>
                  <div className="font-bold text-3xl">Text 3XL</div>
                  <div className="font-bold text-2xl">Text 2XL</div>
                  <div className="font-bold text-xl">Text XL</div>
                  <div className="font-bold text-lg">Text LG</div>
                  <div className="font-bold text-base">Text Base</div>
                  <div className="font-bold text-sm">Text SM</div>
                  <div className="font-bold text-xs">Text XS</div>
                  <div className="font-bold text-2xs">Text 2XS</div>
                  <div className="font-bold text-3xs">Text 3XS</div>

                  {/* "3xs": ["0.625rem", { lineHeight: "1rem" }],
      "2xs": ["0.75rem", { lineHeight: "1.2rem" }], */}
                </div>
                {/* <!-- step --> */}
                <ul className="steps steps-vertical">
                  <li className="step step-primary">Step 1</li>
                  <li className="step step-primary">Step 2</li>
                  <li className="step">Step 3</li>
                  <li className="step">Step 4</li>
                </ul>
              </div>
            </div>

            {/* <!-- alert --> */}
            <div className="flex flex-col gap-3">
              <div className="alert">
                <div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 stroke-info"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>12 unread messages. Tap to see.</span>
                </div>
              </div>
              <div className="alert alert-info">
                <div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>New software update available.</span>
                </div>
              </div>
              <div className="alert alert-success">
                <div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Your purchase has been confirmed!</span>
                </div>
              </div>
              <div className="alert alert-warning">
                <div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Warning: Invalid email address!</span>
                </div>
              </div>
              <div className="alert alert-error">
                <div>
                  <svg
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Error! Task failed successfully.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
