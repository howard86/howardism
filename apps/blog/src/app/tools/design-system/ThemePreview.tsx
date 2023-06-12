import { CloseIcon } from "@/app/CloseIcon"

const LINK_TEXT = "I'm a simple link"

export default function ThemePreview() {
  return (
    <section className="space-y-8">
      <div>
        <h2 className="px-2 pb-4 text-xl font-bold">Custom</h2>

        <div className="not-prose rounded-box grid gap-3 border border-base-content/5 bg-base-100 p-6 text-base-content">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <button type="button" className="btn-brand btn">
              Default
            </button>
            <button type="button" className="btn-brand btn-circle btn">
              <CloseIcon className="w-8" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="px-2 pb-4 text-xl font-bold">Preview</h2>
        <div className="bg-transparent">
          <div className="not-prose rounded-box grid gap-3 border border-base-content/5 bg-base-100 p-6 text-base-content">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <button type="button" className="btn">
                Default
              </button>
              <button type="button" className="btn-primary btn">
                Primary
              </button>
              <button type="button" className="btn-secondary btn">
                Secondary
              </button>
              <button type="button" className="btn-accent btn">
                Accent
              </button>
              <button type="button" className="btn-info btn">
                Info
              </button>
              <button type="button" className="btn-success btn">
                Success
              </button>
              <button type="button" className="btn-warning btn">
                Warning
              </button>
              <button type="button" className="btn-error btn">
                Error
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <button type="button" className="btn-outline btn">
                Default
              </button>
              <button type="button" className="btn-primary btn-outline btn">
                Primary
              </button>
              <button type="button" className="btn-secondary btn-outline btn">
                Secondary
              </button>
              <button type="button" className="btn-accent btn-outline btn">
                Accent
              </button>
              <button type="button" className="btn-info btn-outline btn">
                Info
              </button>
              <button type="button" className="btn-success btn-outline btn">
                Success
              </button>
              <button type="button" className="btn-warning btn-outline btn">
                Warning
              </button>
              <button type="button" className="btn-error btn-outline btn">
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
                    <button type="button" className="tab-lifted tab">
                      Tab
                    </button>
                    <button type="button" className="tab-lifted tab tab-active">
                      Tab
                    </button>
                    <button type="button" className="tab-lifted tab">
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
                  <progress value="20" max="100" className="progress">
                    Default
                  </progress>
                  <progress value="25" max="100" className="progress-primary progress">
                    Primary
                  </progress>
                  <progress value="30" max="100" className="progress-secondary progress">
                    Secondary
                  </progress>
                  <progress value="40" max="100" className="progress-accent progress">
                    Accent
                  </progress>
                  <progress value="45" max="100" className="progress-info progress">
                    Info
                  </progress>
                  <progress value="55" max="100" className="progress-success progress">
                    Success
                  </progress>
                  <progress value="70" max="100" className="progress-warning progress">
                    Warning
                  </progress>
                  <progress value="90" max="100" className="progress-error progress">
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
                    <input type="checkbox" className="toggle" checked />
                    <input type="checkbox" className="toggle-primary toggle" checked />
                    <input type="checkbox" className="toggle-secondary toggle" checked />
                    <input type="checkbox" className="toggle-accent toggle" checked />
                  </div>
                  {/* <!-- checkbox --> */}
                  <div>
                    <input type="checkbox" className="checkbox" checked />
                    <input type="checkbox" className="checkbox-primary checkbox" checked />
                    <input type="checkbox" className="checkbox-secondary checkbox" checked />
                    <input type="checkbox" className="checkbox-accent checkbox" checked />
                  </div>
                  {/* <!-- radio --> */}
                  <div>
                    <input type="radio" name="radio-1" className="radio" checked />
                    <input type="radio" name="radio-1" className="radio-primary radio" />
                    <input type="radio" name="radio-1" className="radio-secondary radio" />
                    <input type="radio" name="radio-1" className="radio-accent radio" />
                  </div>
                </div>
                {/* <!-- range --> */}
                <div className="md:w-1/2">
                  <input type="range" min="0" max="100" value="90" className="range range-xs" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value="70"
                    className="range range-primary range-xs"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value="50"
                    className="range range-secondary range-xs"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value="40"
                    className="range range-accent range-xs"
                  />
                </div>
              </div>
              {/* <!-- input --> */}
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex flex-col gap-3 md:w-1/2">
                  <input
                    type="text"
                    placeholder="Default"
                    className="input-bordered input w-full"
                  />
                  <input
                    type="text"
                    placeholder="Primary"
                    className="input-bordered input-primary input w-full"
                  />
                  <input
                    type="text"
                    placeholder="Secondary"
                    className="input-bordered input-secondary input w-full"
                  />
                  <input
                    type="text"
                    placeholder="Accent"
                    className="input-bordered input-accent input w-full"
                  />
                </div>
                <div className="flex flex-col gap-3 md:w-1/2">
                  <input
                    type="text"
                    placeholder="Info"
                    className="input-bordered input-info input w-full"
                  />
                  <input
                    type="text"
                    placeholder="Success"
                    className="input-bordered input-success input w-full"
                  />
                  <input
                    type="text"
                    placeholder="Warning"
                    className="input-bordered input-warning input w-full"
                  />
                  <input
                    type="text"
                    placeholder="Error"
                    className="input-bordered input-error input w-full"
                  />
                </div>
              </div>
              {/* <!-- navbar --> */}
              <div className="navbar rounded-box bg-neutral text-neutral-content">
                <div className="flex-none">
                  <button type="button" className="btn-ghost btn-square btn">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="inline-block h-5 w-5 stroke-current"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <button type="button" className="btn-ghost btn text-xl normal-case">
                    daisyUI
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                {/* <!-- headings --> */}
                <div className="flex flex-grow flex-col gap-3">
                  <div className="text-9xl font-bold">Text 9XL</div>
                  <div className="text-8xl font-bold">Text 8XL</div>
                  <div className="text-7xl font-bold">Text 7XL</div>
                  <div className="text-6xl font-bold">Text 6XL</div>
                  <div className="text-5xl font-bold">Text 5XL</div>
                  <div className="text-4xl font-bold">Text 4XL</div>
                  <div className="text-3xl font-bold">Text 3XL</div>
                  <div className="text-2xl font-bold">Text 2XL</div>
                  <div className="text-xl font-bold">Text XL</div>
                  <div className="text-lg font-bold">Text LG</div>
                  <div className="text-base font-bold">Text Base</div>
                  <div className="text-sm font-bold">Text SM</div>
                  <div className="text-xs font-bold">Text XS</div>
                  <div className="text-2xs font-bold">Text 2XS</div>
                  <div className="text-3xs font-bold">Text 3XS</div>

                  {/* "3xs": ["0.625rem", { lineHeight: "1rem" }],
      "2xs": ["0.75rem", { lineHeight: "1.2rem" }], */}
                </div>
                {/* <!-- step --> */}
                <ul className="steps steps-vertical">
                  <li className="step-primary step">Step 1</li>
                  <li className="step-primary step">Step 2</li>
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
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="h-6 w-6 flex-shrink-0 stroke-info"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>12 unread messages. Tap to see.</span>
                </div>
              </div>
              <div className="alert alert-info">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>New software update available.</span>
                </div>
              </div>
              <div className="alert alert-success">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Your purchase has been confirmed!</span>
                </div>
              </div>
              <div className="alert alert-warning">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>Warning: Invalid email address!</span>
                </div>
              </div>
              <div className="alert alert-error">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 flex-shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
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
  )
}
