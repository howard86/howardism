export default function ColorTable() {
  return (
    <section className="prose">
      <h2>Benefits</h2>

      <p>
        Semantic color names make more sense because when we design interfaces, we don&apos;t just
        use any random color. We define a specific color palette with names like{" "}
        <code>primary</code>, <code>secondary</code>, etc. and we only use those specific colors in
        our interfaces.
      </p>

      <p>
        Also, using semantic color names makes theming easier. You wouldn&apos;t have to define
        dark-mode colors for every single element and you wouldn&apos;t be limited to only
        light/dark themes. you can have multiple themes available and each theme is just a few lines
        of CSS variables.
      </p>

      <h2>List of all daisyUI color names</h2>

      <p>You can use these color names in your theme or in utility classes.</p>

      <div className="overflow-x-auto">
        <div className="whitespace-nowrap">
          <table>
            <thead>
              <tr>
                <th>Color name + description</th>
                <th>Required or optional for themes</th>
                <th>Example use</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-primary" />
                  <span className="font-mono font-bold">primary</span> <br />
                  <span className="text-xs opacity-60">Primary color</span>
                </td>
                <td>
                  <span className="badge badge-sm">required</span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-primary`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--p))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-primary-focus" />
                  <span className="font-mono font-bold">primary-focus</span> <br />
                  <span className="text-xs opacity-60">Primary color when focused</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a darker tone of primary if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-primary-focus`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--pf))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-primary-content" />
                  <span className="font-mono font-bold">primary-content</span> <br />
                  <span className="text-xs opacity-60">
                    Foreground content color to use on primary color
                  </span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a readable tone of primary if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-primary-content`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--pc))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-secondary" />
                  <span className="font-mono font-bold">secondary</span> <br />
                  <span className="text-xs opacity-60">Secondary color</span>
                </td>
                <td>
                  <span className="badge badge-sm">required</span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-secondary`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--s))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-secondary-focus" />
                  <span className="font-mono font-bold">secondary-focus</span> <br />
                  <span className="text-xs opacity-60">Secondary color when focused</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a darker tone of secondary if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-secondary-focus`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--sf))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-secondary-content" />
                  <span className="font-mono font-bold">secondary-content</span> <br />
                  <span className="text-xs opacity-60">
                    Foreground content color to use on secondary color
                  </span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a readable tone of secondary if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-secondary-content`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--sc))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-accent" />
                  <span className="font-mono font-bold">accent</span> <br />
                  <span className="text-xs opacity-60">Accent color</span>
                </td>
                <td>
                  <span className="badge badge-sm">required</span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-accent`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--a))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-accent-focus" />
                  <span className="font-mono font-bold">accent-focus</span> <br />
                  <span className="text-xs opacity-60">Accent color when focused</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a darker tone of accent if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-accent-focus`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--af))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-accent-content" />
                  <span className="font-mono font-bold">accent-content</span> <br />
                  <span className="text-xs opacity-60">
                    Foreground content color to use on accent color
                  </span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a readable tone of accent if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-accent-content`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--ac))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-neutral" />
                  <span className="font-mono font-bold">neutral</span> <br />
                  <span className="text-xs opacity-60">Neutral color</span>
                </td>
                <td>
                  <span className="badge badge-sm">required</span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-neutral`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--n))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-neutral-focus" />
                  <span className="font-mono font-bold">neutral-focus</span> <br />
                  <span className="text-xs opacity-60">Neutral color when focused</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a darker tone of neutral if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-neutral-focus`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--nf))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-neutral-content" />
                  <span className="font-mono font-bold">neutral-content</span> <br />
                  <span className="text-xs opacity-60">
                    Foreground content color to use on neutral color
                  </span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a readable tone of neutral if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-neutral-content`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--nc))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-base-100" />
                  <span className="font-mono font-bold">base-100</span> <br />
                  <span className="text-xs opacity-60">
                    Base color of page, used for blank backgrounds
                  </span>
                </td>
                <td>
                  <span className="badge badge-sm">required</span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-base-100`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--b1))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-base-200" />
                  <span className="font-mono font-bold">base-200</span> <br />
                  <span className="text-xs opacity-60">Base color, a little darker</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a darker tone of base-100 if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-base-200`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--b2))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-base-300" />
                  <span className="font-mono font-bold">base-300</span> <br />
                  <span className="text-xs opacity-60">Base color, even more darker</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a darker tone of base-200 if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-base-300`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--b3))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-base-content" />
                  <span className="font-mono font-bold">base-content</span> <br />
                  <span className="text-xs opacity-60">
                    Foreground content color to use on base color
                  </span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a readable tone of base-100 if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-base-content`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--bc))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-info" />
                  <span className="font-mono font-bold">info</span> <br />
                  <span className="text-xs opacity-60">Info color</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a default color if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-info`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--i))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="bg-info-focus badge relative top-4" />
                  <span className="font-mono font-bold">info-focus</span> <br />
                  <span className="text-xs opacity-60">Info color when focused</span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a darker tone of info if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">Class name: `bg-info-focus`</span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--if))`
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge relative top-4 bg-info-content" />
                  <span className="font-mono font-bold">info-content</span> <br />
                  <span className="text-xs opacity-60">
                    Foreground content color to use on info color
                  </span>
                </td>
                <td>
                  <span className="badge badge-ghost badge-sm">optional</span>
                  <br />
                  <span className="text-xs opacity-60">
                    Will be a readable tone of info if not specified
                  </span>
                </td>
                <td>
                  <span className="font-mono text-xs opacity-60">
                    Class name: `bg-info-content`
                  </span>
                  <br />
                  <span className="font-mono text-xs opacity-60">
                    CSS variable: `hsl(var(--ic))`
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
