import { Check } from "lucide-react";
import { useState } from "react";

export interface Step {
  description: string;
  summary: string;
}

interface ProcedureStepProps {
  className?: string;
  steps: Step[];
}

const THEME_COLOR = "hsl(var(--primary))";
const LIGHT_THEME_COLOR = "hsl(var(--muted))";

const getCircleColor = (isViewed: boolean, isChecked: boolean): string => {
  if (isViewed) {
    return "hsl(var(--primary-foreground))";
  }
  return isChecked ? THEME_COLOR : "hsl(var(--foreground))";
};

// TODO: refactor with useReducer
export default function ProcedureStep({
  steps,
  className,
}: ProcedureStepProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const isFirst = openIndex === 0;
  const isLast = openIndex === steps.length - 1;
  const afterLast = openIndex === steps.length;

  const handleNext = () => setOpenIndex((i) => i + 1);
  const handleBack = () => setOpenIndex((i) => i - 1);
  const handleReset = () => {
    setOpenIndex(0);
    if (expanded) {
      setExpanded(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-4 flex w-full items-center justify-between p-2">
        <h2 className="font-semibold text-lg sm:text-xl">料理步驟</h2>
        <button
          className="mx-2 rounded-lg bg-secondary px-4 py-1.5 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80"
          onClick={() => setExpanded((v) => !v)}
          type="button"
        >
          {expanded ? "收回" : "展開"}
        </button>
      </div>
      {/* Note: this calculates the total height when expanded or not */}
      <div
        style={{
          minHeight: expanded
            ? `${92 * steps.length + 200}px`
            : `${60 * steps.length + 116}px`,
        }}
      >
        {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: step rendering with expanded/collapsed states */}
        {steps.map((step, index) => {
          const isViewed = index === openIndex;
          const isChecked = index < openIndex;
          const showLastBox = index < steps.length - 1;

          return (
            <div key={step.summary}>
              <div className="flex items-center gap-4 font-bold">
                <div
                  className="flex size-8 items-center justify-center rounded-full border"
                  style={{
                    background: isViewed ? THEME_COLOR : "white",
                    borderColor:
                      isChecked || isViewed ? THEME_COLOR : LIGHT_THEME_COLOR,
                    color: getCircleColor(isViewed, isChecked),
                  }}
                >
                  {!isChecked || expanded ? (
                    index + 1
                  ) : (
                    <Check className="size-4" />
                  )}
                </div>
                <h2 className="text-lg">{step.summary}</h2>
              </div>
              {(expanded || index === openIndex) && (
                <div
                  className="mt-2 ml-4 border-l pb-3 pl-8 text-black"
                  style={{
                    borderLeftColor:
                      isViewed || isChecked ? THEME_COLOR : LIGHT_THEME_COLOR,
                  }}
                >
                  {step.description}
                  {!expanded && isViewed && (
                    <div className="mt-4 flex justify-between">
                      <button
                        className="rounded-lg bg-secondary px-4 py-1.5 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80 disabled:pointer-events-none disabled:opacity-50"
                        disabled={isFirst}
                        onClick={handleBack}
                        type="button"
                      >
                        上一步
                      </button>
                      <button
                        className="rounded-lg bg-secondary px-4 py-1.5 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80"
                        onClick={handleNext}
                        type="button"
                      >
                        {isLast ? "完成！" : "下一步"}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {showLastBox && (
                <div
                  className="mb-2 ml-4 border-l p-2"
                  style={{
                    borderLeftColor:
                      isChecked || isViewed ? THEME_COLOR : LIGHT_THEME_COLOR,
                    marginTop: isViewed || expanded ? 0 : "0.5rem",
                  }}
                />
              )}
            </div>
          );
        })}
        {(afterLast || expanded) && (
          <div className="p-4 text-center">
            <p className="my-4">料理完成！</p>
            <button
              className="rounded-lg bg-secondary px-4 py-1.5 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary/80"
              onClick={handleReset}
              type="button"
            >
              重頭開始
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
